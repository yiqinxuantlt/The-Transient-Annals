import path from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import type { StartedFushengluApi } from '../server/src/index.ts'
import { resolveDesktopDataPaths } from './desktopPaths.ts'

const apiHost = '127.0.0.1'
const apiPort = 4177

let mainWindow: BrowserWindow | null = null
let api: StartedFushengluApi | null = null
let isQuitting = false
let fatalErrorShown = false

app.setName('Fushenglu')

function configureDesktopEnvironment() {
  const paths = resolveDesktopDataPaths(app.getPath('userData'))

  process.env.FUSHENGLU_API_HOST = apiHost
  process.env.FUSHENGLU_API_PORT = String(apiPort)
  process.env.FUSHENGLU_DB_PATH = paths.databasePath
  process.env.FUSHENGLU_SQLITE_PATH = paths.sqlitePath
}

function isExternalNavigation(targetUrl: string, currentUrl: string) {
  try {
    return new URL(targetUrl).origin !== new URL(currentUrl).origin
  } catch {
    return true
  }
}

function formatError(error: unknown) {
  return error instanceof Error ? error.stack || error.message : String(error)
}

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return value.replace(/[&<>"']/g, (char) => replacements[char] || char)
}

async function showFatalError(title: string, error: unknown) {
  const message = formatError(error)
  fatalErrorShown = true
  console.error(title, message)

  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 620,
      show: true,
      backgroundColor: '#f7f0df',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })
  }

  const escapedTitle = escapeHtml(title)
  const html = `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapedTitle}</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f0df;
        color: #241c15;
      }

      main {
        max-width: 860px;
      }

      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        padding: 16px;
        border: 1px solid #d8c7a3;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapedTitle}</h1>
      <p>桌面应用启动或加载时遇到错误。请保留以下信息用于排查。</p>
      <pre>${escapeHtml(message)}</pre>
    </main>
  </body>
</html>`

  mainWindow.show()
  await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#f7f0df',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame === false) return

      void showFatalError(
        '浮生录页面加载失败',
        new Error(`${errorCode} ${errorDescription}: ${validatedURL}`),
      )
    },
  )

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL()

    if (currentUrl && isExternalNavigation(url, currentUrl)) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  const devServerUrl = process.env.FUSHENGLU_ELECTRON_DEV_SERVER_URL

  try {
    if (!app.isPackaged && devServerUrl) {
      await mainWindow.loadURL(devServerUrl)
      return
    }

    await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  } catch (error) {
    if (!fatalErrorShown) throw error
  }
}

async function startDesktopApp() {
  configureDesktopEnvironment()
  const { startFushengluApi } = await import('../server/src/index.ts')
  api = await startFushengluApi({ host: apiHost, port: apiPort })
  await createMainWindow()
}

async function stopDesktopApp() {
  if (!api) return

  await api.close()
  api = null
}

app.whenReady().then(() => {
  void startDesktopApp().catch((error: unknown) => {
    void showFatalError('浮生录启动失败', error)
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createMainWindow()
  }
})

app.on('before-quit', (event) => {
  if (!api || isQuitting) return

  event.preventDefault()
  isQuitting = true

  void stopDesktopApp().finally(() => {
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
