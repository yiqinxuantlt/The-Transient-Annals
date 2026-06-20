$ErrorActionPreference = 'Stop'

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$sourcePath = Join-Path $root 'public\fushenglu-logo.png'
$outputDirectory = Join-Path $root 'build'
$outputPath = Join-Path $outputDirectory 'icon.ico'

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Logo source not found: $sourcePath"
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Image]::FromFile($sourcePath)
$bitmap = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$memory = New-Object System.IO.MemoryStream
$file = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create)
$writer = New-Object System.IO.BinaryWriter($file)

try {
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($source, 0, 0, 256, 256)
  $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)

  $pngBytes = $memory.ToArray()
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]1)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$pngBytes.Length)
  $writer.Write([UInt32]22)
  $writer.Write($pngBytes)
} finally {
  $writer.Dispose()
  $file.Dispose()
  $memory.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  $source.Dispose()
}

Write-Output "Created $outputPath"
