import { copyFile, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createInitialDatabase,
  normalizeDatabase,
  type FushengDatabase,
} from './schema.ts'
import { createSqliteStorage } from './sqliteStorage.ts'
import type { DatabaseStorage, DatabaseUpdater } from './storageAdapter.ts'

const currentFile = fileURLToPath(import.meta.url)
const serverRoot = path.resolve(path.dirname(currentFile), '..')
const dataDirectory = path.resolve(serverRoot, 'data')
const defaultDatabasePath = path.join(dataDirectory, 'fushenglu-db.json')
const defaultSqlitePath = path.join(dataDirectory, 'fushenglu-db.sqlite')
let operationQueue: Promise<unknown> = Promise.resolve()
const cleanedDirectories = new Set<string>()

const resolveDatabasePath = () => process.env.FUSHENGLU_DB_PATH || defaultDatabasePath
const resolveSqlitePath = () => process.env.FUSHENGLU_SQLITE_PATH || defaultSqlitePath
const shouldUseSqliteStorage = () => process.env.FUSHENGLU_STORAGE === 'sqlite'

async function ensureDataDirectory() {
  const databasePath = resolveDatabasePath()
  await mkdir(path.dirname(databasePath), { recursive: true })
  if (!cleanedDirectories.has(path.dirname(databasePath))) {
    cleanedDirectories.add(path.dirname(databasePath))
    await cleanupStaleTempFiles()
  }
}

async function cleanupStaleTempFiles() {
  const databasePath = resolveDatabasePath()
  try {
    const entries = await readdir(path.dirname(databasePath))
    const baseName = path.basename(databasePath)
    for (const entry of entries) {
      if (entry.startsWith(`${baseName}.`) && entry.endsWith('.tmp')) {
        await unlink(path.join(path.dirname(databasePath), entry)).catch(() => undefined)
      }
    }
  } catch {
    // best-effort cleanup
  }
}

async function writeDatabaseFile(database: FushengDatabase) {
  await ensureDataDirectory()
  const databasePath = resolveDatabasePath()
  const tempPath = `${databasePath}.${Date.now()}-${Math.round(Math.random() * 100000)}.tmp`
  await writeFile(tempPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8')

  try {
    await rename(tempPath, databasePath)
  } catch {
    // On Windows rename can fail if the target is locked; fall back to copyFile.
    await copyFile(tempPath, databasePath)
    await unlink(tempPath).catch(() => undefined)
  }
}

async function readJsonDatabase() {
  await operationQueue.catch(() => undefined)
  return readDatabaseFile()
}

async function readDatabaseFile() {
  await ensureDataDirectory()
  const databasePath = resolveDatabasePath()

  try {
    const raw = await readFile(databasePath, 'utf8')
    return normalizeDatabase(JSON.parse(raw))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      const backupPath = `${databasePath}.corrupt-${Date.now()}`
      await copyFile(databasePath, backupPath).catch(() => undefined)
    }

    const initialDatabase = createInitialDatabase()
    await writeDatabaseFile(initialDatabase)
    return initialDatabase
  }
}

async function saveJsonDatabase(database: FushengDatabase) {
  const normalizedDatabase = normalizeDatabase(database)
  const operation = operationQueue
    .catch(() => undefined)
    .then(async () => {
      await writeDatabaseFile(normalizedDatabase)
      return normalizedDatabase
    })

  operationQueue = operation.then(
    () => undefined,
    () => undefined,
  )

  await operation
  return normalizedDatabase
}

async function updateJsonDatabase(updater: DatabaseUpdater) {
  const operation = operationQueue
    .catch(() => undefined)
    .then(async () => {
      const currentDatabase = await readDatabaseFile()
      const nextDatabase = normalizeDatabase(updater(currentDatabase))
      await writeDatabaseFile(nextDatabase)
      return nextDatabase
    })

  operationQueue = operation.then(
    () => undefined,
    () => undefined,
  )

  return operation
}

function getJsonDatabasePath() {
  return resolveDatabasePath()
}

const jsonDatabaseStorage: DatabaseStorage = {
  kind: 'json-file',
  read: readJsonDatabase,
  save: saveJsonDatabase,
  update: updateJsonDatabase,
  location: getJsonDatabasePath,
}

const sqliteDatabaseStorage = createSqliteStorage({
  databasePath: resolveSqlitePath,
  seedJsonPath: resolveDatabasePath,
})

const getActiveStorage = () =>
  shouldUseSqliteStorage() ? sqliteDatabaseStorage : jsonDatabaseStorage

export const databaseStorage: DatabaseStorage = {
  get kind() {
    return getActiveStorage().kind
  },
  read() {
    return getActiveStorage().read()
  },
  save(database) {
    return getActiveStorage().save(database)
  },
  update(updater) {
    return getActiveStorage().update(updater)
  },
  location() {
    return getActiveStorage().location()
  },
}

export const readDatabase = () => databaseStorage.read()

export const saveDatabase = (database: FushengDatabase) => databaseStorage.save(database)

export const updateDatabase = (updater: DatabaseUpdater) => databaseStorage.update(updater)

export const getDatabasePath = () => databaseStorage.location()
