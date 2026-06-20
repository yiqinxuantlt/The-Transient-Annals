import type { FushengDatabase } from './schema.ts'

export type DatabaseUpdater = (database: FushengDatabase) => FushengDatabase

export type StorageKind = 'json-file' | 'sqlite'

export type DatabaseWriteOptions = {
  backupReason?: string
}

export type DatabaseStorage = {
  kind: StorageKind
  read: () => Promise<FushengDatabase>
  save: (
    database: FushengDatabase,
    options?: DatabaseWriteOptions,
  ) => Promise<FushengDatabase>
  update: (
    updater: DatabaseUpdater,
    options?: DatabaseWriteOptions,
  ) => Promise<FushengDatabase>
  location: () => string
}
