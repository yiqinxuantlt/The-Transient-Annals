# Desktop Reliability And Data Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Windows desktop release reliably render, validate itself before sharing, carry proper app identity metadata, and create recoverable local backups before high-risk data writes.

**Architecture:** Keep the existing Electron + Vite + Express + Zustand architecture. Add small focused helpers around route parsing, storage backups, release icons, desktop smoke validation, and startup diagnostics instead of restructuring the app.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Electron 42, electron-builder 26, Express 5, Zustand 5, Vitest 4, PowerShell, Windows System.Drawing APIs.

---

## File Structure

- Create `src/routes/currentProjectRoute.ts`: pure helper for resolving the active project ID from browser routes and desktop hash routes.
- Create `src/routes/currentProjectRoute.test.ts`: unit tests for route helper behavior.
- Modify `src/store/useFushengluStore.ts`: use the route helper and pass backup reasons for high-risk project mutations.
- Modify `src/store/useFushengluStore.test.ts`: add hash-route coverage and backend backup-reason assertions.
- Create `server/src/backups.ts`: file backup creation, reason sanitization, and retention pruning.
- Create `server/src/backups.test.ts`: unit tests for backup creation and retention.
- Modify `server/src/storageAdapter.ts`: add optional write metadata for backup reasons.
- Modify `server/src/storage.ts`: create backups before high-risk writes, then delegate to JSON or SQLite storage.
- Modify `server/src/app.ts`: read backup reason headers on write routes and pass them to storage.
- Modify `server/src/storage.test.ts`: verify high-risk writes create backups through the public storage API.
- Modify `src/lib/fushengluApi.ts`: send optional backup reason headers for save/delete requests.
- Create `scripts/create-windows-icon.ps1`: generate a tracked Windows `.ico` file from the existing PNG logo.
- Create `scripts/desktop-smoke.ps1`: launch unpacked desktop release, capture a temp screenshot, and fail if the window is blank.
- Create `build/icon.ico`: generated Windows application icon, tracked in Git.
- Modify `package.json`: version, description, author, desktop scripts, icon metadata.
- Modify `electron/main.ts`: show useful startup or renderer-load failures instead of leaving a hidden blank window.

## Task 1: Fix Current Project Resolution For Desktop Hash Routes

**Files:**
- Create: `src/routes/currentProjectRoute.ts`
- Create: `src/routes/currentProjectRoute.test.ts`
- Modify: `src/store/useFushengluStore.ts`
- Modify: `src/store/useFushengluStore.test.ts`

- [ ] **Step 1: Write the route helper tests**

Create `src/routes/currentProjectRoute.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getProjectIdFromLocation } from './currentProjectRoute'

describe('getProjectIdFromLocation', () => {
  it('reads project IDs from normal browser paths', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/projects/project-browser/dashboard',
        hash: '',
      }),
    ).toBe('project-browser')
  })

  it('reads project IDs from desktop hash-router paths', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/C:/Program Files/Fushenglu/resources/app.asar/dist/index.html',
        hash: '#/projects/project-desktop/library',
      }),
    ).toBe('project-desktop')
  })

  it('decodes URL-encoded project IDs', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/projects/project%20with%20spaces/events',
        hash: '',
      }),
    ).toBe('project with spaces')
  })

  it('returns undefined when no project route is active', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/help',
        hash: '',
      }),
    ).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the route helper tests and verify they fail**

Run:

```powershell
npm test -- src/routes/currentProjectRoute.test.ts
```

Expected: FAIL because `src/routes/currentProjectRoute.ts` does not exist.

- [ ] **Step 3: Implement the route helper**

Create `src/routes/currentProjectRoute.ts`:

```ts
type RouteLocation = Pick<Location, 'hash' | 'pathname'>

function getRoutePath(location: RouteLocation) {
  if (location.hash.startsWith('#/')) {
    return location.hash.slice(1).split('?')[0].split('#')[0]
  }

  return location.pathname
}

export function getProjectIdFromLocation(location: RouteLocation) {
  const routePath = getRoutePath(location)
  const match = routePath.match(/^\/projects\/([^/?#]+)/)

  if (!match?.[1]) return undefined

  return decodeURIComponent(match[1])
}
```

- [ ] **Step 4: Run route helper tests and verify they pass**

Run:

```powershell
npm test -- src/routes/currentProjectRoute.test.ts
```

Expected: PASS.

- [ ] **Step 5: Use the helper from the store**

In `src/store/useFushengluStore.ts`, add this import:

```ts
import { getProjectIdFromLocation } from '../routes/currentProjectRoute'
```

Replace the `routeProjectId` and `decodedRouteProjectId` block inside `getCurrentProjectId` with:

```ts
        const routeProjectId =
          typeof window === 'undefined'
            ? undefined
            : getProjectIdFromLocation(window.location)

        return projects.some((project) => project.id === routeProjectId)
          ? routeProjectId
          : projects[0]?.id
```

Remove the old `decodedRouteProjectId` variable and its return block.

- [ ] **Step 6: Add store coverage for hash routes**

In `src/store/useFushengluStore.test.ts`, add this test inside `describe('analysis note store actions', () => { ... })` after the existing route-scoped note test:

```ts
  it('targets the project from a desktop hash route', () => {
    const firstProject = makeStoreProject('project-first-hash-route')
    const routedProject = makeStoreProject('project-routed-hash-route')
    const routedEvent = routedProject.events[0]

    if (!routedEvent) throw new Error('Expected sample event')

    useFushengluStore.setState({
      projects: [firstProject, routedProject],
      theme: 'light',
      sidebarCollapsed: false,
      backendStatus: 'offline',
    })
    window.history.pushState({}, '', '/index.html#/projects/project-routed-hash-route/events')

    const noteId = useFushengluStore.getState().addAnalysisNote({
      title: 'Hash route scoped note',
      graphMode: 'events',
      startId: routedEvent.id,
      nodeIds: [routedEvent.id],
      edgeIds: [],
      summary: 'This note belongs to the hash-routed project.',
    })

    const projects = useFushengluStore.getState().projects

    expect(projects.find((project) => project.id === firstProject.id)?.analysisNotes).toEqual([])
    expect(projects.find((project) => project.id === routedProject.id)?.analysisNotes[0]?.id).toBe(
      noteId,
    )
  })
```

- [ ] **Step 7: Run the affected tests**

Run:

```powershell
npm test -- src/routes/currentProjectRoute.test.ts src/store/useFushengluStore.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit route fix**

Run:

```powershell
git add src/routes/currentProjectRoute.ts src/routes/currentProjectRoute.test.ts src/store/useFushengluStore.ts src/store/useFushengluStore.test.ts
git commit -m "fix: resolve desktop hash project routes"
```

## Task 2: Add Bounded Local Database Backups

**Files:**
- Create: `server/src/backups.ts`
- Create: `server/src/backups.test.ts`
- Modify: `server/src/storageAdapter.ts`
- Modify: `server/src/storage.ts`
- Modify: `server/src/storage.test.ts`

- [ ] **Step 1: Write backup helper tests**

Create `server/src/backups.test.ts`:

```ts
// @vitest-environment node

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabaseBackup } from './backups'

let tempDirectory: string | undefined

async function makeTempDirectory() {
  tempDirectory = await mkdtemp(path.join(tmpdir(), 'fushenglu-backups-'))
  return tempDirectory
}

afterEach(async () => {
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true })
    tempDirectory = undefined
  }
})

describe('createDatabaseBackup', () => {
  it('does not create a backup when the active database does not exist yet', async () => {
    const directory = await makeTempDirectory()
    const databasePath = path.join(directory, 'fushenglu-db.json')

    const result = await createDatabaseBackup(databasePath, 'first-run')

    expect(result.created).toBe(false)
    expect(result.reason).toBe('first-run')
    await expect(readdir(path.join(directory, 'backups'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('copies the active database into a timestamped backup file', async () => {
    const directory = await makeTempDirectory()
    const databasePath = path.join(directory, 'fushenglu-db.json')
    await writeFile(databasePath, '{"projects":[]}\n', 'utf8')

    const result = await createDatabaseBackup(
      databasePath,
      'replace project data',
      new Date('2026-06-20T01:02:03.000Z'),
    )

    expect(result.created).toBe(true)
    expect(result.backupPath).toBe(
      path.join(
        directory,
        'backups',
        'fushenglu-db.2026-06-20T01-02-03-000Z.replace-project-data.json',
      ),
    )
    await expect(readFile(result.backupPath!, 'utf8')).resolves.toBe('{"projects":[]}\n')
  })

  it('keeps only the newest backup files for a database', async () => {
    const directory = await makeTempDirectory()
    const backupsDirectory = path.join(directory, 'backups')
    const databasePath = path.join(directory, 'fushenglu-db.json')
    await mkdir(backupsDirectory, { recursive: true })
    await writeFile(databasePath, '{"projects":[]}\n', 'utf8')

    for (let index = 0; index < 22; index += 1) {
      await writeFile(
        path.join(
          backupsDirectory,
          `fushenglu-db.2026-06-19T00-00-${String(index).padStart(2, '0')}-000Z.old.json`,
        ),
        `${index}`,
        'utf8',
      )
    }

    await createDatabaseBackup(databasePath, 'clear project data', new Date('2026-06-20T00:00:00.000Z'), 20)

    const backups = await readdir(backupsDirectory)

    expect(backups).toHaveLength(20)
    expect(backups).toContain('fushenglu-db.2026-06-20T00-00-00-000Z.clear-project-data.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-00-000Z.old.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-01-000Z.old.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-02-000Z.old.json')
  })
})
```

- [ ] **Step 2: Run backup helper tests and verify they fail**

Run:

```powershell
npm test -- server/src/backups.test.ts
```

Expected: FAIL because `server/src/backups.ts` does not exist.

- [ ] **Step 3: Implement backup helper**

Create `server/src/backups.ts`:

```ts
import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

export type DatabaseBackupResult = {
  created: boolean
  reason: string
  backupPath?: string
}

const DEFAULT_MAX_BACKUPS = 20

function sanitizeBackupReason(reason: string) {
  return reason
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'manual'
}

function formatBackupTimestamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function getBackupFileName(databasePath: string, reason: string, timestamp: Date) {
  const extension = path.extname(databasePath) || '.bak'
  const baseName = path.basename(databasePath, extension)

  return `${baseName}.${formatBackupTimestamp(timestamp)}.${sanitizeBackupReason(reason)}${extension}`
}

async function pruneBackups(databasePath: string, maxBackups: number) {
  const extension = path.extname(databasePath) || '.bak'
  const baseName = path.basename(databasePath, extension)
  const backupsDirectory = path.join(path.dirname(databasePath), 'backups')
  const entries = await readdir(backupsDirectory).catch(() => [])
  const backupFiles = entries
    .filter((entry) => entry.startsWith(`${baseName}.`) && entry.endsWith(extension))
    .sort()

  const staleFiles = backupFiles.slice(0, Math.max(0, backupFiles.length - maxBackups))

  await Promise.all(
    staleFiles.map((entry) =>
      unlink(path.join(backupsDirectory, entry)).catch(() => undefined),
    ),
  )
}

export async function createDatabaseBackup(
  databasePath: string,
  reason: string,
  timestamp = new Date(),
  maxBackups = DEFAULT_MAX_BACKUPS,
): Promise<DatabaseBackupResult> {
  try {
    await stat(databasePath)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { created: false, reason }
    }

    throw error
  }

  const backupsDirectory = path.join(path.dirname(databasePath), 'backups')
  await mkdir(backupsDirectory, { recursive: true })

  const backupPath = path.join(
    backupsDirectory,
    getBackupFileName(databasePath, reason, timestamp),
  )

  await copyFile(databasePath, backupPath)
  await pruneBackups(databasePath, maxBackups)

  return {
    created: true,
    reason,
    backupPath,
  }
}
```

- [ ] **Step 4: Run backup helper tests and verify they pass**

Run:

```powershell
npm test -- server/src/backups.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add write options to storage types**

Modify `server/src/storageAdapter.ts`:

```ts
import type { FushengDatabase } from './schema.ts'

export type DatabaseUpdater = (database: FushengDatabase) => FushengDatabase

export type StorageKind = 'json-file' | 'sqlite'

export type DatabaseWriteOptions = {
  backupReason?: string
}

export type DatabaseStorage = {
  kind: StorageKind
  read: () => Promise<FushengDatabase>
  save: (database: FushengDatabase, options?: DatabaseWriteOptions) => Promise<FushengDatabase>
  update: (
    updater: DatabaseUpdater,
    options?: DatabaseWriteOptions,
  ) => Promise<FushengDatabase>
  location: () => string
}
```

- [ ] **Step 6: Wire backups through the public storage API**

In `server/src/storage.ts`, update the imports:

```ts
import { createDatabaseBackup } from './backups.ts'
import type { DatabaseStorage, DatabaseUpdater, DatabaseWriteOptions } from './storageAdapter.ts'
```

Add this helper before `jsonDatabaseStorage`:

```ts
async function backupActiveDatabase(options?: DatabaseWriteOptions) {
  if (!options?.backupReason) return

  await createDatabaseBackup(databaseStorage.location(), options.backupReason)
}
```

Change the `DatabaseStorage` wrapper methods near the bottom to:

```ts
export const databaseStorage: DatabaseStorage = {
  get kind() {
    return getActiveStorage().kind
  },
  read() {
    return getActiveStorage().read()
  },
  async save(database, options) {
    await backupActiveDatabase(options)
    return getActiveStorage().save(database, options)
  },
  async update(updater, options) {
    await backupActiveDatabase(options)
    return getActiveStorage().update(updater, options)
  },
  location() {
    return getActiveStorage().location()
  },
}

export const readDatabase = () => databaseStorage.read()

export const saveDatabase = (database: FushengDatabase, options?: DatabaseWriteOptions) =>
  databaseStorage.save(database, options)

export const updateDatabase = (updater: DatabaseUpdater, options?: DatabaseWriteOptions) =>
  databaseStorage.update(updater, options)
```

Leave `jsonDatabaseStorage` and `sqliteDatabaseStorage` implementations accepting their existing arguments; TypeScript allows a function with fewer parameters to satisfy callers that pass unused optional options.

- [ ] **Step 7: Add public storage backup test**

In `server/src/storage.test.ts`, add `readdir` and `readFile` to the first import:

```ts
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
```

Add this test inside `describe('storage transactions', () => { ... })`:

```ts
  it('creates a backup before high-risk database updates', async () => {
    await loadIsolatedStorage()
    const initialDatabase: FushengDatabase = { schemaVersion: 5, projects: [makeProject(1)] }

    await saveDatabase(initialDatabase)
    await updateDatabase(
      (database) => ({
        ...database,
        projects: [],
      }),
      { backupReason: 'clear project data' },
    )

    const backupsDirectory = path.join(tempDirectory!, 'backups')
    const backups = await readdir(backupsDirectory)

    expect(backups).toHaveLength(1)
    expect(backups[0]).toMatch(/^db\..+\.clear-project-data\.json$/)
    await expect(readFile(path.join(backupsDirectory, backups[0]), 'utf8')).resolves.toContain(
      'project-1',
    )
  })
```

- [ ] **Step 8: Run storage tests**

Run:

```powershell
npm test -- server/src/backups.test.ts server/src/storage.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit backup storage foundation**

Run:

```powershell
git add server/src/backups.ts server/src/backups.test.ts server/src/storageAdapter.ts server/src/storage.ts server/src/storage.test.ts
git commit -m "feat: back up local data before risky writes"
```

## Task 3: Pass Backup Reasons Through API And Store

**Files:**
- Modify: `server/src/app.ts`
- Modify: `src/lib/fushengluApi.ts`
- Modify: `src/store/useFushengluStore.ts`
- Modify: `src/store/useFushengluStore.test.ts`

- [ ] **Step 1: Add API client backup options**

In `src/lib/fushengluApi.ts`, add this type near the constants:

```ts
type BackendWriteOptions = {
  backupReason?: string
}
```

Add this helper before `requestJson`:

```ts
function backupHeaders(options?: BackendWriteOptions) {
  return options?.backupReason
    ? { 'X-Fushenglu-Backup-Reason': options.backupReason }
    : {}
}
```

Change `saveProjectToBackend` to:

```ts
export async function saveProjectToBackend(
  project: FushengProject,
  options?: BackendWriteOptions,
) {
  const payload = await requestJson<{ project: FushengProject }>(
    `/projects/${encodeURIComponent(project.id)}`,
    {
      method: 'PUT',
      headers: backupHeaders(options),
      body: JSON.stringify(project),
    },
  )

  return payload.project
}
```

Change `deleteProjectFromBackend` to:

```ts
export async function deleteProjectFromBackend(
  projectId: string,
  options?: BackendWriteOptions,
) {
  await requestJson<{ ok: true }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: backupHeaders(options),
  })
}
```

- [ ] **Step 2: Read backup reason headers on server writes**

In `server/src/app.ts`, add this helper after `routeParam`:

```ts
const backupReasonHeader = (request: Request) =>
  routeParam(request.header('x-fushenglu-backup-reason')).trim() || undefined
```

In `PUT /api/projects/:projectId`, change the `updateDatabase` call from:

```ts
      await updateDatabase((database) => {
```

to:

```ts
      await updateDatabase((database) => {
```

and close it with options:

```ts
      }, { backupReason: backupReasonHeader(request) })
```

The full PUT update block should end as:

```ts
        return { ...database, projects }
      }, { backupReason: backupReasonHeader(request) })
```

In `DELETE /api/projects/:projectId`, close the `updateDatabase` call with:

```ts
      }, { backupReason: backupReasonHeader(request) || 'delete-project' })
```

In `POST /api/projects/:projectId/restore-sample`, update the internal `updateProject` helper signature first:

```ts
async function updateProject(
  projectId: string,
  updater: (project: ReturnType<typeof normalizeProject>) => ReturnType<typeof normalizeProject>,
  backupReason?: string,
) {
```

Then close its internal `updateDatabase` call with:

```ts
  }, { backupReason })
```

Finally call it from restore sample with:

```ts
      const nextProject = await updateProject(
        projectId,
        (project) =>
          normalizeProject(
            createSampleProject(
              project.id,
              project.title,
              project.category,
              project.subtitle,
              project.templateId,
            ),
          ),
        backupReasonHeader(request) || 'restore-sample-data',
      )
```

Run formatting after implementation so the multiline call is readable.

- [ ] **Step 3: Pass backup reasons from the store**

In `src/store/useFushengluStore.ts`, add this type near `ProjectDraft`:

```ts
type CommitProjectOptions = {
  backupReason?: string
}
```

Change `syncProject` to accept options:

```ts
      const syncProject = async (
        project: FushengProject,
        options?: CommitProjectOptions,
      ) => {
        try {
          await saveProjectToBackend(normalizeProjectForStorage(project), {
            backupReason: options?.backupReason,
          })
```

Change `commitProject` to accept options:

```ts
      const commitProject = (
        projectId: string,
        updater: (project: FushengProject) => FushengProject | undefined,
        options?: CommitProjectOptions,
      ) => {
```

Change its final sync line to:

```ts
        if (changedProject) void syncProject(changedProject, options)
```

Change `deleteProject` backend call to:

```ts
          void deleteProjectFromBackend(projectId, { backupReason: 'delete-project' })
```

Change `replaceProjectData` to:

```ts
          commitProject(
            projectId,
            (project) => cleanImportedProject(project, importedProject),
            { backupReason: 'replace-project-data' },
          )
```

Change `restoreSampleData` to pass the option as the third argument:

```ts
          commitProject(
            projectId,
            (project) => ({
              ...createSampleProject(
                project.id,
                project.title,
                project.category,
                project.subtitle,
                project.templateId,
              ),
              updatedAt: now(),
            }),
            { backupReason: 'restore-sample-data' },
          )
```

Change `clearProjectData` to:

```ts
        clearProjectData: (projectId) => {
          commitProject(
            projectId,
            (project) => ({
              ...project,
              entities: [],
              events: [],
              entityRelations: [],
              eventLinks: [],
              libraryItems: [],
              analysisNotes: [],
              entityNodePositions: {},
              eventNodePositions: {},
            }),
            { backupReason: 'clear-project-data' },
          )
          logEvent('Project data cleared', { projectId })
        },
```

Run formatting after implementation so the changed calls are readable.

- [ ] **Step 4: Assert backup reasons in store tests**

In `src/store/useFushengluStore.test.ts`, change the mock import block to include named mocks:

```ts
import {
  deleteProjectFromBackend,
  saveProjectToBackend,
} from '../lib/fushengluApi'
```

Add this test inside `describe('analysis note store actions', () => { ... })`:

```ts
  it('passes backup reasons for high-risk project writes', () => {
    const project = makeStoreProject('project-risky-write-reasons')
    setStoreProject(project)

    useFushengluStore.getState().replaceProjectData(project.id, {
      ...project,
      title: 'Imported project',
    })
    useFushengluStore.getState().restoreSampleData(project.id)
    useFushengluStore.getState().clearProjectData(project.id)
    useFushengluStore.getState().deleteProject(project.id)

    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id, title: 'Imported project' }),
      { backupReason: 'replace-project-data' },
    )
    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id }),
      { backupReason: 'restore-sample-data' },
    )
    expect(saveProjectToBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: project.id,
        entities: [],
        events: [],
        entityRelations: [],
        eventLinks: [],
        libraryItems: [],
        analysisNotes: [],
      }),
      { backupReason: 'clear-project-data' },
    )
    expect(deleteProjectFromBackend).toHaveBeenCalledWith(project.id, {
      backupReason: 'delete-project',
    })
  })
```

- [ ] **Step 5: Run API and store tests**

Run:

```powershell
npm test -- src/store/useFushengluStore.test.ts server/src/index.test.ts server/src/storage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit backup reason plumbing**

Run:

```powershell
git add server/src/app.ts src/lib/fushengluApi.ts src/store/useFushengluStore.ts src/store/useFushengluStore.test.ts
git commit -m "feat: request backups for risky project writes"
```

## Task 4: Add Release Metadata And Windows Icon

**Files:**
- Create: `scripts/create-windows-icon.ps1`
- Create: `build/icon.ico`
- Modify: `package.json`

- [ ] **Step 1: Create the icon generation script**

Create `scripts/create-windows-icon.ps1`:

```powershell
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
```

- [ ] **Step 2: Generate the Windows icon**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/create-windows-icon.ps1
```

Expected: `build/icon.ico` exists and is larger than 0 bytes.

- [ ] **Step 3: Update package metadata and scripts**

Modify top-level metadata in `package.json` to:

```json
{
  "name": "fushenglu",
  "private": true,
  "version": "0.1.0",
  "description": "A local visual knowledge graph workspace for people, events, timelines, and narrative archives.",
  "author": "Tian Lutao",
  "type": "module",
  "main": "dist-electron/main.cjs"
}
```

Keep the existing dependencies and other fields. In the `scripts` block, add:

```json
"desktop:create-icon": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/create-windows-icon.ps1",
"desktop:smoke": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/desktop-smoke.ps1",
"release:check": "npm test && npm run desktop:dist && npm run desktop:smoke"
```

Change `desktop:dist` to:

```json
"desktop:dist": "npm run desktop:create-icon && npm run desktop:build && electron-builder --win nsis"
```

In the `build.win` object, add:

```json
"icon": "build/icon.ico"
```

- [ ] **Step 4: Run metadata validation build**

Run:

```powershell
npm run desktop:create-icon
npm run desktop:dist
```

Expected:
- `release/Fushenglu Setup 0.1.0.exe` is created.
- electron-builder output does not include `description is missed`, `author is missed`, or `default Electron icon is used`.

- [ ] **Step 5: Commit release metadata and icon**

Run:

```powershell
git add package.json package-lock.json scripts/create-windows-icon.ps1 build/icon.ico
git commit -m "build: add desktop release identity"
```

## Task 5: Add Desktop Smoke Test Script

**Files:**
- Create: `scripts/desktop-smoke.ps1`
- Modify: `package.json`

- [ ] **Step 1: Create smoke test script**

Create `scripts/desktop-smoke.ps1`:

```powershell
$ErrorActionPreference = 'Stop'

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$exe = Join-Path $root 'release\win-unpacked\Fushenglu.exe'

if (-not (Test-Path -LiteralPath $exe)) {
  throw "Desktop executable not found. Run npm run desktop:dist first. Missing: $exe"
}

$proc = Start-Process -FilePath $exe -PassThru

try {
  Start-Sleep -Seconds 8

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
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
'@
  Add-Type -AssemblyName System.Drawing

  $windows = New-Object System.Collections.Generic.List[object]
  [FushengluSmokeWin32]::EnumWindows({
    param($hWnd, $lParam)

    [uint32]$windowPid = 0
    [void][FushengluSmokeWin32]::GetWindowThreadProcessId($hWnd, [ref]$windowPid)

    if ($windowPid -eq [uint32]$proc.Id -and [FushengluSmokeWin32]::IsWindowVisible($hWnd)) {
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

  if ($windows.Count -eq 0) {
    throw "No visible Fushenglu window found for PID $($proc.Id)"
  }

  $window = $windows | Sort-Object Width -Descending | Select-Object -First 1

  if ($window.Width -lt 800 -or $window.Height -lt 500) {
    throw "Desktop window is unexpectedly small: $($window.Width)x$($window.Height)"
  }

  [void][FushengluSmokeWin32]::SetForegroundWindow($window.Handle)
  Start-Sleep -Milliseconds 500

  $screenshotPath = Join-Path $env:TEMP 'fushenglu-desktop-smoke.png'
  $bitmap = New-Object System.Drawing.Bitmap ([int]$window.Width), ([int]$window.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen([int]$window.Left, [int]$window.Top, 0, 0, $bitmap.Size)
  $graphics.Dispose()

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
  $bitmap.Dispose()

  if ($colors.Count -lt 16) {
    throw "Desktop smoke screenshot looks blank. Unique sampled colors: $($colors.Count). Screenshot: $screenshotPath"
  }

  Write-Output "Desktop smoke passed"
  Write-Output "Window title: $($window.Title)"
  Write-Output "Window size: $($window.Width)x$($window.Height)"
  Write-Output "Unique sampled colors: $($colors.Count)"
  Write-Output "Screenshot: $screenshotPath"
} finally {
  if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
}
```

- [ ] **Step 2: Ensure package scripts include smoke commands**

If Task 4 has already added the scripts, confirm `package.json` contains:

```json
"desktop:smoke": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/desktop-smoke.ps1",
"release:check": "npm test && npm run desktop:dist && npm run desktop:smoke"
```

If Task 4 has not added them, add both lines to the `scripts` block now.

- [ ] **Step 3: Run desktop smoke test**

Run:

```powershell
npm run desktop:dist
npm run desktop:smoke
```

Expected:
- `npm run desktop:dist` succeeds.
- `npm run desktop:smoke` prints `Desktop smoke passed`.
- The screenshot path points into the OS temp directory, not the repository.

- [ ] **Step 4: Commit smoke test**

Run:

```powershell
git add scripts/desktop-smoke.ps1 package.json package-lock.json
git commit -m "test: add desktop release smoke check"
```

## Task 6: Show Startup And Renderer Load Failures

**Files:**
- Modify: `electron/main.ts`

- [ ] **Step 1: Add fatal error renderer helper**

In `electron/main.ts`, add this helper before `createMainWindow`:

```ts
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
  console.error(title, message)

  if (!mainWindow) {
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

  const html = `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 32px; font-family: system-ui, sans-serif; background: #f7f0df; color: #241c15; }
      pre { white-space: pre-wrap; padding: 16px; border: 1px solid #d8c7a3; background: rgba(255, 255, 255, 0.65); border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>桌面应用启动时遇到错误。请保留这段信息用于排查。</p>
    <pre>${escapeHtml(message)}</pre>
  </body>
</html>`

  mainWindow.show()
  await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
}
```

- [ ] **Step 2: Show renderer load failures**

Inside `createMainWindow`, before `setWindowOpenHandler`, add:

```ts
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    void showFatalError(
      '浮生录页面加载失败',
      new Error(`${errorCode} ${errorDescription}: ${validatedURL}`),
    )
  })
```

- [ ] **Step 3: Catch desktop startup failures**

Replace:

```ts
app.whenReady().then(() => {
  void startDesktopApp()
})
```

with:

```ts
app.whenReady().then(() => {
  void startDesktopApp().catch((error: unknown) => {
    void showFatalError('浮生录启动失败', error)
  })
})
```

- [ ] **Step 4: Run Electron build and smoke validation**

Run:

```powershell
npm run desktop:build
npm run desktop:dist
npm run desktop:smoke
```

Expected: all commands pass, and the smoke test still sees the normal app screen.

- [ ] **Step 5: Commit startup diagnostics**

Run:

```powershell
git add electron/main.ts
git commit -m "fix: surface desktop startup failures"
```

## Task 7: Final Validation And Release Check

**Files:**
- Generated: `dist/`, `dist-electron/`, `release/`
- No source edits expected.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 2: Run web production build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite production build pass.

- [ ] **Step 3: Run desktop release check**

Run:

```powershell
npm run release:check
```

Expected:
- test suite passes;
- Windows installer is generated;
- desktop smoke check passes;
- `release/Fushenglu Setup 0.1.0.exe` exists.

- [ ] **Step 4: Confirm generated outputs remain ignored**

Run:

```powershell
git status -sb
git clean -ndX
```

Expected:
- `git status -sb` shows only intended tracked source changes if any remain;
- `git clean -ndX` lists generated folders such as `dist/`, `dist-electron/`, and `release/`, plus `node_modules/`.

- [ ] **Step 5: Push the completed branch after user approval**

If the user asks to publish:

```powershell
git push -u origin main
```

Expected: local commits push to `origin/main`.

## Self-Review

- Spec coverage: Task 1 covers desktop hash route correctness; Task 2 and Task 3 cover recoverable backups before high-risk writes; Task 4 covers app version, author, description, icon, and clearer installer naming; Task 5 covers automated desktop blank-window detection; Task 6 covers visible startup and renderer-load failures; Task 7 covers release validation.
- Placeholder scan: this plan contains no placeholder implementation steps and no deferred requirements inside the scoped reliability pass.
- Type consistency: `DatabaseWriteOptions`, `backupReason`, `getProjectIdFromLocation`, `createDatabaseBackup`, `desktop:smoke`, and `release:check` are defined before use.
