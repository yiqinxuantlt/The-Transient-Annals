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
    expect(result.reason).toBe('replace-project-data')
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

    await createDatabaseBackup(
      databasePath,
      'clear project data',
      new Date('2026-06-20T00:00:00.000Z'),
      20,
    )

    const backups = await readdir(backupsDirectory)

    expect(backups).toHaveLength(20)
    expect(backups).toContain('fushenglu-db.2026-06-20T00-00-00-000Z.clear-project-data.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-00-000Z.old.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-01-000Z.old.json')
    expect(backups).not.toContain('fushenglu-db.2026-06-19T00-00-02-000Z.old.json')
  })
})
