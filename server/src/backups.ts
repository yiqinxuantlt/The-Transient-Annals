import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

export type DatabaseBackupResult = {
  created: boolean
  reason: string
  backupPath?: string
}

const DEFAULT_MAX_BACKUPS = 20

function isMissingFileError(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function sanitizeBackupReason(reason: string) {
  return (
    reason
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'manual'
  )
}

function formatBackupTimestamp(timestamp: Date) {
  return timestamp.toISOString().replace(/[:.]/g, '-')
}

function getDatabaseNameParts(databasePath: string) {
  const extension = path.extname(databasePath) || '.bak'
  const baseName = path.basename(databasePath, path.extname(databasePath))

  return { baseName, extension }
}

function getBackupFileName(databasePath: string, reason: string, timestamp: Date) {
  const { baseName, extension } = getDatabaseNameParts(databasePath)

  return `${baseName}.${formatBackupTimestamp(timestamp)}.${reason}${extension}`
}

async function pruneBackups(databasePath: string, backupsDirectory: string, maxBackups: number) {
  const { baseName, extension } = getDatabaseNameParts(databasePath)
  const entries = await readdir(backupsDirectory).catch(() => [])
  const backupFiles = entries
    .filter((entry) => entry.startsWith(`${baseName}.`) && entry.endsWith(extension))
    .sort()
  const staleFiles = backupFiles.slice(0, Math.max(0, backupFiles.length - maxBackups))

  await Promise.all(
    staleFiles.map((entry) => unlink(path.join(backupsDirectory, entry)).catch(() => undefined)),
  )
}

export async function createDatabaseBackup(
  databasePath: string,
  reason: string,
  timestamp = new Date(),
  maxBackups = DEFAULT_MAX_BACKUPS,
): Promise<DatabaseBackupResult> {
  const sanitizedReason = sanitizeBackupReason(reason)

  try {
    await stat(databasePath)
  } catch (error) {
    if (isMissingFileError(error)) {
      return { created: false, reason: sanitizedReason }
    }

    throw error
  }

  const backupsDirectory = path.join(path.dirname(databasePath), 'backups')
  const retainedBackupLimit = Math.max(1, Math.floor(maxBackups))
  await mkdir(backupsDirectory, { recursive: true })

  const backupPath = path.join(
    backupsDirectory,
    getBackupFileName(databasePath, sanitizedReason, timestamp),
  )

  await copyFile(databasePath, backupPath)
  await pruneBackups(databasePath, backupsDirectory, retainedBackupLimit)

  return {
    created: true,
    reason: sanitizedReason,
    backupPath,
  }
}
