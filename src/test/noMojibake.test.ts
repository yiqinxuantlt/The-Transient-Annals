import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const sourceRoot = join(process.cwd(), 'src')
const scannedExtensions = new Set(['.ts', '.tsx'])
const mojibakePattern = new RegExp(
  [
    '\u9358',
    '\u5997',
    '\u7487',
    '\u9225',
    '\u951b',
    '\u9428',
    '\u7ecc',
    '\u93bc',
    '\u7035',
    '\u6d5c\u8679',
    '\u93c2\u677f',
    '\u6769',
    '\u7efe\u8de8',
    '\u7f02\u6827',
    '\u6d63\u8de8',
    '\u6d93\u5eb5',
    '\u704f\u5fda',
    '\u93c3\u5815',
    '\u9365\u72b3',
    '\u93ac\u660f',
    '\u9422\u71b7',
    '\u95c3\u4f43',
    '\u7eeb\u8bf2',
    '\u6fee\u64b3',
  ].join('|'),
)

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      return collectSourceFiles(path)
    }

    if (!stats.isFile()) {
      return []
    }

    const extension = path.slice(path.lastIndexOf('.'))
    return scannedExtensions.has(extension) ? [path] : []
  })
}

describe('source text integrity', () => {
  it('does not contain common mojibake markers in production source files', () => {
    const offenders = collectSourceFiles(sourceRoot)
      .filter((file) => basename(file) !== 'noMojibake.test.ts')
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter((file) => mojibakePattern.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(`${process.cwd()}\\`, '').replace(`${process.cwd()}/`, ''))

    expect(offenders).toEqual([])
  })
})
