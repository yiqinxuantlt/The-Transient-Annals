import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
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

async function ensureDataDirectory() {
  await mkdir(path.dirname(databasePath), { recursive: true })
}

async function writeDatabaseFile(database: FushengDatabase) {
  await ensureDataDirectory()
  const tempPath = `${databasePath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8')
  await rename(tempPath, databasePath)
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
  await writeDatabaseFile(normalizedDatabase)
  return normalizedDatabase
}

export function getDatabasePath() {
  return databasePath
}
