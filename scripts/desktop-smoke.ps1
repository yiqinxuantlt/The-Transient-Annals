$ErrorActionPreference = 'Stop'

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$exe = Join-Path $root 'release\win-unpacked\Fushenglu.exe'

if (-not (Test-Path -LiteralPath $exe)) {
  throw "Desktop executable not found. Run npm run desktop:dist first. Missing: $exe"
}

Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;

public class FushengluSmokeWin32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);

  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }
}
'@
Add-Type -AssemblyName System.Drawing

function Get-VisibleProcessWindows {
  param(
    [Parameter(Mandatory = $true)]
    [System.Diagnostics.Process]$Process
  )

  $windows = New-Object System.Collections.Generic.List[object]

  [FushengluSmokeWin32]::EnumWindows({
    param($hWnd, $lParam)

    [uint32]$windowPid = 0
    [void][FushengluSmokeWin32]::GetWindowThreadProcessId($hWnd, [ref]$windowPid)

    if ($windowPid -eq [uint32]$Process.Id -and [FushengluSmokeWin32]::IsWindowVisible($hWnd)) {
      $titleBuilder = New-Object System.Text.StringBuilder 512
      [void][FushengluSmokeWin32]::GetWindowText($hWnd, $titleBuilder, $titleBuilder.Capacity)

      $rect = New-Object FushengluSmokeWin32+RECT
      [void][FushengluSmokeWin32]::GetWindowRect($hWnd, [ref]$rect)

      $windows.Add([pscustomobject]@{
        Handle = $hWnd
        Title = $titleBuilder.ToString()
        Left = $rect.Left
        Top = $rect.Top
        Width = $rect.Right - $rect.Left
        Height = $rect.Bottom - $rect.Top
      })
    }

    return $true
  }, [IntPtr]::Zero) | Out-Null

  return $windows
}

function Wait-ForVisibleWindow {
  param(
    [Parameter(Mandatory = $true)]
    [System.Diagnostics.Process]$Process,

    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  do {
    $Process.Refresh()

    if ($Process.HasExited) {
      throw "Fushenglu exited before opening a visible window. Exit code: $($Process.ExitCode)"
    }

    $window = Get-VisibleProcessWindows -Process $Process |
      Sort-Object Width -Descending |
      Select-Object -First 1

    if ($null -ne $window) {
      return $window
    }

    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)

  throw "No visible Fushenglu window found for PID $($Process.Id)"
}

$proc = Start-Process -FilePath $exe -PassThru

try {
  $window = Wait-ForVisibleWindow -Process $proc

  if ($window.Width -lt 800 -or $window.Height -lt 500) {
    throw "Desktop window is unexpectedly small: $($window.Width)x$($window.Height)"
  }

  [void][FushengluSmokeWin32]::SetForegroundWindow($window.Handle)
  Start-Sleep -Milliseconds 500

  $screenshotPath = Join-Path $env:TEMP 'fushenglu-desktop-smoke.png'
  $bitmap = New-Object System.Drawing.Bitmap ([int]$window.Width), ([int]$window.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.CopyFromScreen([int]$window.Left, [int]$window.Top, 0, 0, $bitmap.Size)

    $colors = New-Object 'System.Collections.Generic.HashSet[string]'
    $stepX = [Math]::Max(1, [Math]::Floor($bitmap.Width / 24))
    $stepY = [Math]::Max(1, [Math]::Floor($bitmap.Height / 18))

    for ($x = 0; $x -lt $bitmap.Width; $x += $stepX) {
      for ($y = 0; $y -lt $bitmap.Height; $y += $stepY) {
        $pixel = $bitmap.GetPixel($x, $y)
        [void]$colors.Add("$($pixel.R),$($pixel.G),$($pixel.B)")
      }
    }

    $bitmap.Save($screenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }

  if ($colors.Count -lt 16) {
    throw "Desktop smoke screenshot looks blank. Unique sampled colors: $($colors.Count). Screenshot: $screenshotPath"
  }

  Write-Output "Desktop smoke passed"
  Write-Output "Window title: $($window.Title)"
  Write-Output "Window size: $($window.Width)x$($window.Height)"
  Write-Output "Unique sampled colors: $($colors.Count)"
  Write-Output "Screenshot: $screenshotPath"
} finally {
  if ($null -ne $proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
}
