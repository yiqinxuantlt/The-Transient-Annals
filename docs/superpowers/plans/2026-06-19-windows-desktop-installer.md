# Windows Desktop Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shareable Windows installer `.exe` for Fushenglu that runs the React app and embedded local API without requiring recipients to install Node.js.

**Architecture:** Add Electron as a thin desktop shell. Refactor the Express API so Electron can start and stop it programmatically, keep installed-user data under Electron's `userData` directory, and package the Vite renderer plus Electron main process with `electron-builder`.

**Tech Stack:** React 19, Vite 8, Express 5, TypeScript 6, Electron, electron-builder, esbuild, wait-on, cross-env, Vitest.

---

## File Structure

- Modify `package.json`: add Electron dependencies, desktop scripts, `main`, and electron-builder metadata.
- Modify `.gitignore`: ignore generated Electron and installer output directories.
- Create `server/src/app.ts`: owns Express app construction and routes.
- Modify `server/src/index.ts`: becomes the reusable API lifecycle entry and preserves `npm run api`.
- Create `server/src/index.test.ts`: verifies API lifecycle startup, health response, and shutdown.
- Modify `src/routes/router.tsx`: use hash routing only for desktop builds loaded from `file://`.
- Create `electron/main.ts`: starts the local API, creates the browser window, blocks unsafe navigation, and closes the API on quit.
- Create `electron/main.test.ts`: verifies desktop data-path derivation with a pure helper.

## Task 1: Desktop Dependencies And Package Metadata

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install desktop build dependencies**

Run:

```powershell
npm install -D electron electron-builder esbuild wait-on cross-env
```

Expected: `package.json` and `package-lock.json` update with the new dev dependencies.

- [ ] **Step 2: Add desktop scripts and package metadata**

Modify `package.json` so the top-level object includes `"main": "dist-electron/main.cjs"` after `"type": "module"`, and replace the `scripts` block with this exact block:

```json
{
  "dev": "concurrently -k -n api,web -c yellow,cyan \"npm:dev:api\" \"npm:dev:web\"",
  "dev:web": "vite",
  "dev:api": "tsx watch server/src/index.ts",
  "api": "tsx server/src/index.ts",
  "build": "tsc -b && tsc -p server/tsconfig.json && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "desktop:build-main": "esbuild electron/main.ts --bundle --platform=node --target=node22 --format=cjs --outfile=dist-electron/main.cjs --external:electron",
  "desktop:build-renderer": "cross-env VITE_DESKTOP=true VITE_API_BASE_URL=http://127.0.0.1:4177/api vite build",
  "desktop:build": "tsc -b && tsc -p server/tsconfig.json && npm run desktop:build-main && npm run desktop:build-renderer",
  "desktop:start": "electron .",
  "desktop:dev": "concurrently -k -n web,electron -c cyan,magenta \"cross-env VITE_DESKTOP=true VITE_API_BASE_URL=http://127.0.0.1:4177/api npm:dev:web\" \"wait-on http://127.0.0.1:5173 && npm run desktop:build-main && cross-env FUSHENGLU_ELECTRON_DEV_SERVER_URL=http://127.0.0.1:5173 npm run desktop:start\"",
  "desktop:dist": "npm run desktop:build && electron-builder --win nsis"
}
```

Add this exact `build` block near the end of `package.json`, before `dependencies`:

```json
{
  "appId": "com.fushenglu.desktop",
  "productName": "Fushenglu",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**",
    "dist-electron/**",
    "package.json"
  ],
  "extraMetadata": {
    "main": "dist-electron/main.cjs"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": [
          "x64"
        ]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Fushenglu"
  }
}
```

- [ ] **Step 3: Ignore generated desktop outputs**

Append these lines to `.gitignore`:

```gitignore
dist-electron/
release/
```

- [ ] **Step 4: Run dependency and metadata checks**

Run:

```powershell
npm test
```

Expected: all Vitest suites pass. No Electron code exists yet, so this task only checks dependency installation did not break current behavior.

- [ ] **Step 5: Commit dependency metadata**

Run:

```powershell
git add package.json package-lock.json .gitignore
git commit -m "build: add desktop packaging dependencies"
```

## Task 2: Refactor Express API Into Reusable Lifecycle

**Files:**
- Create: `server/src/app.ts`
- Modify: `server/src/index.ts`
- Create: `server/src/index.test.ts`

- [ ] **Step 1: Write the lifecycle test**

Create `server/src/index.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { startFushengluApi, type StartedFushengluApi } from './index.ts'

let startedApi: StartedFushengluApi | null = null

afterEach(async () => {
  if (!startedApi) return
  await startedApi.close()
  startedApi = null
})

describe('startFushengluApi', () => {
  it('starts the API on a requested host and closes cleanly', async () => {
    startedApi = await startFushengluApi({ host: '127.0.0.1', port: 0 })

    expect(startedApi.host).toBe('127.0.0.1')
    expect(startedApi.port).toBeGreaterThan(0)
    expect(startedApi.url).toBe(`http://127.0.0.1:${startedApi.port}`)

    const response = await fetch(`${startedApi.url}/api/health`)
    const payload = await response.json() as { ok: boolean; name: string }

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      ok: true,
      name: 'fushenglu-api',
    })
  })
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```powershell
npm test -- server/src/index.test.ts
```

Expected: FAIL because `startFushengluApi` and `StartedFushengluApi` are not exported yet.

- [ ] **Step 3: Move Express construction into `server/src/app.ts`**

Create `server/src/app.ts` from the current `server/src/index.ts` using this mechanical edit:

- Copy the full current contents of `server/src/index.ts` into `server/src/app.ts`.
- Delete `const port = Number(process.env.FUSHENGLU_API_PORT || 4177)` from `server/src/app.ts`.
- Replace the top-level `const app = express()` line with `export function createFushengluApp() {` followed by an indented `const app = express()`.
- Indent every `app.use`, `app.get`, `app.post`, `app.put`, `app.delete`, and `app.patch` call so it is inside `createFushengluApp`.
- Delete the final `app.listen(...)` block from `server/src/app.ts`.
- Add `return app` and the closing `}` immediately after the error middleware.

The final `server/src/app.ts` imports are:

```ts
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { createSampleProject } from '../../src/data/sampleData.ts'
import type { EdgeVisualStyle, GraphNodePosition } from '../../src/types/index.ts'
import { normalizeProject, SCHEMA_VERSION } from './schema.ts'
import { databaseStorage, getDatabasePath, readDatabase, updateDatabase } from './storage.ts'
```

- [ ] **Step 4: Replace `server/src/index.ts` with lifecycle exports**

Replace `server/src/index.ts` with:

```ts
import type { Server } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createFushengluApp } from './app.ts'

export type FushengluApiOptions = {
  host?: string
  port?: number
}

export type StartedFushengluApi = {
  host: string
  port: number
  url: string
  server: Server
  close: () => Promise<void>
}

function resolvePort(port?: number) {
  return port ?? Number(process.env.FUSHENGLU_API_PORT || 4177)
}

function resolveHost(host?: string) {
  return host ?? process.env.FUSHENGLU_API_HOST || '127.0.0.1'
}

export async function startFushengluApi(
  options: FushengluApiOptions = {},
): Promise<StartedFushengluApi> {
  const host = resolveHost(options.host)
  const requestedPort = resolvePort(options.port)
  const app = createFushengluApp()

  const server = await new Promise<Server>((resolve, reject) => {
    const startedServer = app.listen(requestedPort, host)
    startedServer.once('listening', () => resolve(startedServer))
    startedServer.once('error', reject)
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : requestedPort

  return {
    host,
    port,
    url: `http://${host}:${port}`,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

function isDirectRun() {
  const entry = process.argv[1]
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href)
}

if (isDirectRun()) {
  startFushengluApi()
    .then((api) => {
      console.log(`Fushenglu API ready at ${api.url}`)
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
}
```

- [ ] **Step 5: Run lifecycle and existing API tests**

Run:

```powershell
npm test -- server/src/index.test.ts server/src/schema.test.ts server/src/storage.test.ts
```

Expected: PASS for all selected suites.

- [ ] **Step 6: Commit API lifecycle refactor**

Run:

```powershell
git add server/src/app.ts server/src/index.ts server/src/index.test.ts
git commit -m "refactor: expose reusable api lifecycle"
```

## Task 3: Add Electron Main Process

**Files:**
- Create: `electron/main.ts`
- Create: `electron/main.test.ts`

- [ ] **Step 1: Write pure helper tests for desktop paths**

Create `electron/main.test.ts`:

```ts
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveDesktopDataPaths } from './main.ts'

describe('resolveDesktopDataPaths', () => {
  it('places desktop data under Electron userData', () => {
    const paths = resolveDesktopDataPaths('C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu')

    expect(paths.databasePath).toBe(
      path.join('C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu', 'fushenglu-db.json'),
    )
    expect(paths.sqlitePath).toBe(
      path.join('C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu', 'fushenglu-db.sqlite'),
    )
  })
})
```

- [ ] **Step 2: Run the Electron helper test and verify it fails**

Run:

```powershell
npm test -- electron/main.test.ts
```

Expected: FAIL because `electron/main.ts` does not exist yet.

- [ ] **Step 3: Create Electron main process**

Create `electron/main.ts`:

```ts
import path from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { startFushengluApi, type StartedFushengluApi } from '../server/src/index.ts'

const apiHost = '127.0.0.1'
const apiPort = 4177

let mainWindow: BrowserWindow | null = null
let api: StartedFushengluApi | null = null

export function resolveDesktopDataPaths(userDataPath: string) {
  return {
    databasePath: path.join(userDataPath, 'fushenglu-db.json'),
    sqlitePath: path.join(userDataPath, 'fushenglu-db.sqlite'),
  }
}

function configureDesktopEnvironment() {
  const paths = resolveDesktopDataPaths(app.getPath('userData'))

  process.env.FUSHENGLU_API_HOST = apiHost
  process.env.FUSHENGLU_API_PORT = String(apiPort)
  process.env.FUSHENGLU_DB_PATH = paths.databasePath
  process.env.FUSHENGLU_SQLITE_PATH = paths.sqlitePath
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
      sandbox: false,
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
    if (currentUrl && new URL(url).origin !== new URL(currentUrl).origin) {
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
  if (!api) return
  event.preventDefault()
  void stopDesktopApp().finally(() => app.quit())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 4: Run the helper test**

Run:

```powershell
npm test -- electron/main.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Electron main process**

Run:

```powershell
git add electron/main.ts electron/main.test.ts
git commit -m "feat: add electron desktop shell"
```

## Task 4: Make Renderer Routing Safe For File-Based Desktop Loads

**Files:**
- Modify: `src/routes/router.tsx`

- [ ] **Step 1: Update router creation for desktop builds**

Modify the import from `react-router-dom`:

```ts
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom'
```

Replace the exported router construction with a route array and router factory:

```ts
const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: page(<HomePage />) },
      { path: 'projects', element: page(<ProjectsPage />) },
      { path: 'projects/new', element: page(<TemplateSelectPage />) },
      { path: 'help', element: page(<HelpPage />) },
    ],
  },
  {
    path: '/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: page(<ProjectDashboard />) },
      { path: 'entities', element: page(<EntitiesPage />) },
      { path: 'events', element: page(<EventsPage />) },
      { path: 'timeline', element: page(<TimelinePage />) },
      { path: 'relation-graph', element: page(<RelationGraphPage />) },
      { path: 'event-graph', element: page(<EventGraphPage />) },
      { path: 'library', element: page(<LibraryPage />) },
      { path: 'settings', element: page(<ProjectSettingsPage />) },
      { path: 'help', element: page(<HelpPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

const createRouter = import.meta.env.VITE_DESKTOP === 'true' ? createHashRouter : createBrowserRouter

export const router = createRouter(routes)
```

- [ ] **Step 2: Run React route build checks**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite production build pass.

- [ ] **Step 3: Commit router update**

Run:

```powershell
git add src/routes/router.tsx
git commit -m "fix: use hash routing for desktop builds"
```

## Task 5: Build And Launch Desktop App Locally

**Files:**
- Modify only if a command reveals a concrete TypeScript or packaging error.

- [ ] **Step 1: Build the Electron main bundle**

Run:

```powershell
npm run desktop:build-main
```

Expected: `dist-electron/main.cjs` is created and ignored by git.

- [ ] **Step 2: Build the desktop renderer**

Run:

```powershell
npm run desktop:build-renderer
```

Expected: `dist/index.html` and JS/CSS assets are created and ignored by git.

- [ ] **Step 3: Start desktop app from packaged build assets**

Run:

```powershell
npm run desktop:start
```

Expected: an Electron window opens, the Fushenglu UI renders, and no terminal window is visible inside the app. Close the window before continuing.

- [ ] **Step 4: Run full validation**

Run:

```powershell
npm test
npm run build
npm run desktop:build
```

Expected: all commands pass.

- [ ] **Step 5: Commit any launch fixes**

If Task 5 required source changes, commit only the expected desktop-launch files that actually changed:

```powershell
git status -sb
git add package.json electron/main.ts src/routes/router.tsx server/src/index.ts server/src/app.ts
git commit -m "fix: stabilize desktop launch"
```

If Task 5 required no source changes, do not create an empty commit.

## Task 6: Produce Windows Installer

**Files:**
- Generated output: `release/*.exe`
- Modify only if electron-builder reports a concrete configuration error.

- [ ] **Step 1: Build the installer**

Run:

```powershell
npm run desktop:dist
```

Expected: electron-builder creates a Windows NSIS installer `.exe` under `release/`.

- [ ] **Step 2: Confirm installer output**

Run:

```powershell
Get-ChildItem -Path release -Filter *.exe | Select-Object Name, Length, LastWriteTime
```

Expected: one installer file appears with a non-zero size and a current timestamp.

- [ ] **Step 3: Smoke-test installed or unpacked app**

Install the generated `.exe`, launch `Fushenglu`, create or edit one project, close the app, relaunch it, and confirm the change persists.

Expected: app data persists under the Windows user profile, not under the repository or installation directory.

- [ ] **Step 4: Final repository checks**

Run:

```powershell
git status -sb
npm test
npm run build
```

Expected: generated `dist`, `dist-electron`, and `release` contents are ignored; tests and web build pass.

## Self-Review

- Spec coverage: the plan covers Electron shell, embedded API startup, per-user data paths, Windows NSIS installer output, shareable installation, and verification.
- Scope: this is one focused implementation plan for Windows packaging only.
- Type consistency: `startFushengluApi`, `StartedFushengluApi`, and `resolveDesktopDataPaths` are defined before subsequent tasks use them.
