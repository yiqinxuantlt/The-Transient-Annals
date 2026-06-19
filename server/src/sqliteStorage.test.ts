// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { FushengDatabase } from './schema'
import { createSqliteStorage, resetSqliteStorageForTests } from './sqliteStorage'

let tempDirectory: string | undefined

const makeProject = (index: number) => ({
  schemaVersion: 5,
  id: `sqlite-project-${index}`,
  title: `SQLite Project ${index}`,
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

async function createTempPaths() {
  tempDirectory = await mkdtemp(path.join(tmpdir(), 'fushenglu-sqlite-'))
  const jsonPath = path.join(tempDirectory, 'seed', 'fushenglu-db.json')
  const sqlitePath = path.join(tempDirectory, 'db', 'fushenglu-db.sqlite')
  await mkdir(path.dirname(jsonPath), { recursive: true })
  return { jsonPath, sqlitePath }
}

afterEach(async () => {
  resetSqliteStorageForTests()
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true })
    tempDirectory = undefined
  }
})

describe('sqlite storage adapter', () => {
  it('seeds a new SQLite database from the existing JSON database', async () => {
    const { jsonPath, sqlitePath } = await createTempPaths()
    const seedDatabase: FushengDatabase = {
      schemaVersion: 5,
      projects: [makeProject(1)],
    }
    await writeFile(jsonPath, `${JSON.stringify(seedDatabase, null, 2)}\n`, 'utf8')

    const storage = createSqliteStorage({
      databasePath: () => sqlitePath,
      seedJsonPath: () => jsonPath,
    })

    const database = await storage.read()

    expect(storage.kind).toBe('sqlite')
    expect(storage.location()).toBe(sqlitePath)
    expect(database.projects.map((project) => project.id)).toEqual(['sqlite-project-1'])
  })

  it('serializes concurrent SQLite read-modify-write updates without losing projects', async () => {
    const { jsonPath, sqlitePath } = await createTempPaths()
    const storage = createSqliteStorage({
      databasePath: () => sqlitePath,
      seedJsonPath: () => jsonPath,
    })

    await storage.save({ schemaVersion: 5, projects: [] })
    await Promise.all(
      Array.from({ length: 8 }, (_value, index) =>
        storage.update((database) => ({
          ...database,
          projects: [...database.projects, makeProject(index)],
        })),
      ),
    )

    const database = await storage.read()

    expect(database.projects).toHaveLength(8)
    expect(database.projects.map((project) => project.id).sort()).toEqual([
      'sqlite-project-0',
      'sqlite-project-1',
      'sqlite-project-2',
      'sqlite-project-3',
      'sqlite-project-4',
      'sqlite-project-5',
      'sqlite-project-6',
      'sqlite-project-7',
    ])
  })
})
