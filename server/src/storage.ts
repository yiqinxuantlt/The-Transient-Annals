import { copyFile, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createInitialDatabase,
  normalizeDatabase,
  type FushengDatabase,
} from './schema.ts'

const currentFile = fileURLToPath(import.meta.url)
const serverRoot = path.resolve(path.dirname(currentFile), '..')
const dataDirectory = path.resolve(serverRoot, 'data')
const databasePath = process.env.FUSHENGLU_DB_PATH || path.join(dataDirectory, 'fushenglu-db.json')
let writeQueue = Promise.resolve()
let startupCleanupDone = false

async function ensureDataDirectory() {
  await mkdir(path.dirname(databasePath), { recursive: true })
  if (!startupCleanupDone) {
    startupCleanupDone = true
    await cleanupStaleTempFiles()
  }
}

async function cleanupStaleTempFiles() {
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
  const tempPath = `${databasePath}.${Date.now()}-${Math.round(Math.random() * 100000)}.tmp`
  await writeFile(tempPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8')

  try {
    await rename(tempPath, databasePath)
  } catch {
    // On Windows rename can fail if the target is locked — fall back to copyFile
    await copyFile(tempPath, databasePath)
    await unlink(tempPath).catch(() => undefined)
  }
}

export async function readDatabase() {
  await ensureDataDirectory()

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

export async function saveDatabase(database: FushengDatabase) {
  const normalizedDatabase = normalizeDatabase(database)
  writeQueue = writeQueue.then(() => writeDatabaseFile(normalizedDatabase))
  await writeQueue
  return normalizedDatabase
}

export function getDatabasePath() {
  return databasePath
}
