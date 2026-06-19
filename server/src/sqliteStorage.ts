import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  createInitialDatabase,
  normalizeDatabase,
  type FushengDatabase,
} from './schema.ts'
import type { DatabaseStorage, DatabaseUpdater } from './storageAdapter.ts'

type SqliteStorageOptions = {
  databasePath: () => string
  seedJsonPath: () => string
}

type ProjectRow = {
  payload: string
}

let operationQueue: Promise<unknown> = Promise.resolve()

async function readSeedDatabase(seedJsonPath: string) {
  try {
    const raw = await readFile(seedJsonPath, 'utf8')
    return normalizeDatabase(JSON.parse(raw))
  } catch {
    return createInitialDatabase()
  }
}

async function openDatabase(databasePath: string, seedJsonPath: string) {
  await mkdir(path.dirname(databasePath), { recursive: true })
  const database = new DatabaseSync(databasePath)

  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_updated_at
      ON projects(updated_at DESC);
  `)

  const count = database.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number }
  const schemaVersion = database
    .prepare("SELECT value FROM metadata WHERE key = 'schemaVersion'")
    .get() as { value: string } | undefined

  if (!schemaVersion && count.count === 0) {
    const seedDatabase = await readSeedDatabase(seedJsonPath)
    writeDatabaseRows(database, seedDatabase)
  }

  database
    .prepare('INSERT OR REPLACE INTO metadata(key, value) VALUES (?, ?)')
    .run('schemaVersion', String(normalizeDatabase({ projects: [] }).schemaVersion))

  return database
}

async function withDatabase<T>(
  options: SqliteStorageOptions,
  callback: (database: DatabaseSync) => T,
) {
  const databasePath = options.databasePath()
  const database = await openDatabase(databasePath, options.seedJsonPath())

  try {
    return callback(database)
  } finally {
    database.close()
  }
}

function readDatabaseRows(database: DatabaseSync) {
  const rows = database
    .prepare('SELECT payload FROM projects ORDER BY updated_at DESC')
    .all() as ProjectRow[]

  return normalizeDatabase({
    projects: rows.map((row) => JSON.parse(row.payload)),
  })
}

function writeDatabaseRows(database: DatabaseSync, nextDatabase: FushengDatabase) {
  const normalizedDatabase = normalizeDatabase(nextDatabase)

  database.exec('BEGIN IMMEDIATE')
  try {
    database.prepare('DELETE FROM projects').run()
    const insertProject = database.prepare(
      'INSERT INTO projects(id, updated_at, payload) VALUES (?, ?, ?)',
    )

    for (const project of normalizedDatabase.projects) {
      insertProject.run(project.id, project.updatedAt, JSON.stringify(project))
    }

    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function enqueue<T>(operation: () => Promise<T>) {
  const queuedOperation = operationQueue.catch(() => undefined).then(operation)

  operationQueue = queuedOperation.then(
    () => undefined,
    () => undefined,
  )

  return queuedOperation
}

export function createSqliteStorage(options: SqliteStorageOptions): DatabaseStorage {
  return {
    get kind() {
      return 'sqlite' as const
    },
    read() {
      return enqueue(() => withDatabase(options, readDatabaseRows))
    },
    save(database) {
      const normalizedDatabase = normalizeDatabase(database)
      return enqueue(() =>
        withDatabase(options, (sqliteDatabase) => {
          writeDatabaseRows(sqliteDatabase, normalizedDatabase)
          return normalizedDatabase
        }),
      )
    },
    update(updater: DatabaseUpdater) {
      return enqueue(() =>
        withDatabase(options, (sqliteDatabase) => {
          const currentDatabase = readDatabaseRows(sqliteDatabase)
          const nextDatabase = normalizeDatabase(updater(currentDatabase))
          writeDatabaseRows(sqliteDatabase, nextDatabase)
          return nextDatabase
        }),
      )
    },
    location() {
      return options.databasePath()
    },
  }
}

export function resetSqliteStorageForTests() {
  operationQueue = Promise.resolve()
}
