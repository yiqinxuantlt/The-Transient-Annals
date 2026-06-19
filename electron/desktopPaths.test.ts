import { describe, expect, it } from 'vitest'
import { resolveDesktopDataPaths } from './desktopPaths.ts'

describe('resolveDesktopDataPaths', () => {
  it('places desktop data under Electron userData', () => {
    const userDataPath = 'C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu'
    const paths = resolveDesktopDataPaths(userDataPath)

    expect(paths.databasePath).toBe(
      'C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu\\fushenglu-db.json',
    )
    expect(paths.sqlitePath).toBe(
      'C:\\Users\\Alice\\AppData\\Roaming\\Fushenglu\\fushenglu-db.sqlite',
    )
  })
})
