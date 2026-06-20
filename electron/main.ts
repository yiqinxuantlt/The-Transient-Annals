import path from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import type { StartedFushengluApi } from '../server/src/index.ts'
import { resolveDesktopDataPaths } from './desktopPaths.ts'

const apiHost = '127.0.0.1'
const apiPort = 4177

let mainWindow: BrowserWindow | null = null
let api: StartedFushengluApi | null = null
let isQuitting = false

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

  if (!app.isPackaged && devServerUrl) {
    await mainWindow.loadURL(devServerUrl)
    return
  }

  await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
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
  void startDesktopApp()
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
