import path from 'node:path'

export function resolveDesktopDataPaths(userDataPath: string) {
  return {
    databasePath: path.join(userDataPath, 'fushenglu-db.json'),
    sqlitePath: path.join(userDataPath, 'fushenglu-db.sqlite'),
  }
}
