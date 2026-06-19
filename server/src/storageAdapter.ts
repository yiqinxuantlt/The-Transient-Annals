import type { FushengDatabase } from './schema.ts'

export type DatabaseUpdater = (database: FushengDatabase) => FushengDatabase

export type StorageKind = 'json-file' | 'sqlite'

export type DatabaseStorage = {
  kind: StorageKind
  read: () => Promise<FushengDatabase>
  save: (database: FushengDatabase) => Promise<FushengDatabase>
  update: (updater: DatabaseUpdater) => Promise<FushengDatabase>
  location: () => string
}
