// @vitest-environment node

import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { FushengDatabase } from './schema'
import { resetSqliteStorageForTests } from './sqliteStorage'
import { databaseStorage, readDatabase, saveDatabase, updateDatabase } from './storage'

let tempDirectory: string | undefined

const makeProject = (index: number) => ({
  schemaVersion: 5,
  id: `project-${index}`,
  title: `Project ${index}`,
  subtitle: '',
  templateId: 'fiction' as const,
  category: 'novel' as const,
  updatedAt: `2026-06-18T00:00:0${index}.000Z`,
  entities: [],
  events: [],
  entityRelations: [],
  eventLinks: [],
  libraryItems: [],
  entityNodePositions: {},
  eventNodePositions: {},
  analysisNotes: [],
})

async function loadIsolatedStorage() {
  tempDirectory = await mkdtemp(path.join(tmpdir(), 'fushenglu-storage-'))
  process.env.FUSHENGLU_DB_PATH = path.join(tempDirectory, 'db.json')
}

afterEach(async () => {
  delete process.env.FUSHENGLU_DB_PATH
  delete process.env.FUSHENGLU_SQLITE_PATH
  delete process.env.FUSHENGLU_STORAGE
  resetSqliteStorageForTests()
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true })
    tempDirectory = undefined
  }
})

describe('storage transactions', () => {
  it('serializes concurrent read-modify-write updates without losing projects', async () => {
    await loadIsolatedStorage()
    const initialDatabase: FushengDatabase = { schemaVersion: 5, projects: [] }

    await saveDatabase(initialDatabase)

    await Promise.all(
      Array.from({ length: 8 }, (_value, index) =>
        updateDatabase((database) => ({
          ...database,
          projects: [...database.projects, makeProject(index)],
        })),
      ),
    )

    const database = await readDatabase()

    expect(database.projects).toHaveLength(8)
    expect(database.projects.map((project) => project.id).sort()).toEqual([
      'project-0',
      'project-1',
      'project-2',
      'project-3',
      'project-4',
      'project-5',
      'project-6',
      'project-7',
    ])
  })

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

  it('switches to SQLite storage when configured', async () => {
    await loadIsolatedStorage()
    const sqlitePath = path.join(tempDirectory!, 'db.sqlite')
    process.env.FUSHENGLU_SQLITE_PATH = sqlitePath
    process.env.FUSHENGLU_STORAGE = 'sqlite'

    await saveDatabase({ schemaVersion: 5, projects: [makeProject(9)] })
    const database = await readDatabase()

    expect(databaseStorage.kind).toBe('sqlite')
    expect(databaseStorage.location()).toBe(sqlitePath)
    expect(database.projects.map((project) => project.id)).toEqual(['project-9'])
  })
})
