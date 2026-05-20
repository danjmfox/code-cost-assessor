import type { FileStats, FileCategory } from './types.ts'
import { classifyFile } from './classify-file.ts'
import { CHARS_PER_TOKEN, HOURS_PER_DAY, THROUGHPUT_RATES } from './compute-hours.ts'

const DEFAULT_CATEGORY: FileCategory = 'source'

type FileDiffAccumulator = {
  path: string | null
  charCount: number
}

const isFilePath = (line: string): boolean => line.startsWith('+++ b/')

const extractFilePath = (line: string): string => line.slice(6)

const isAddedContentLine = (line: string): boolean =>
  line.startsWith('+') && !line.startsWith('+++')

const countAddedChars = (line: string): number => line.slice(1).length

const isExcludedFile = (path: string, excludePatterns: RegExp[]): boolean =>
  excludePatterns.some(pattern => pattern.test(path))

const resolveCategory = (path: string, excludePatterns: RegExp[]): FileCategory | null => {
  if (isExcludedFile(path, excludePatterns)) return null
  return classifyFile(path) ?? DEFAULT_CATEGORY
}

const buildFileStats = (path: string, charCount: number, category: FileCategory): FileStats => {
  const tokenCount = charCount / CHARS_PER_TOKEN
  const hours = (tokenCount / THROUGHPUT_RATES[category]) * HOURS_PER_DAY
  return { path, category, charCount, tokenCount, hours }
}

const flushFile = (
  path: string,
  charCount: number,
  excludePatterns: RegExp[],
  results: FileStats[]
): void => {
  const category = resolveCategory(path, excludePatterns)
  if (category !== null) {
    results.push(buildFileStats(path, charCount, category))
  }
}

const processLine = (
  acc: FileDiffAccumulator,
  results: FileStats[],
  excludePatterns: RegExp[],
  line: string
): FileDiffAccumulator => {
  if (isFilePath(line)) {
    if (acc.path !== null) {
      flushFile(acc.path, acc.charCount, excludePatterns, results)
    }
    return { path: extractFilePath(line), charCount: 0 }
  }

  if (isAddedContentLine(line) && acc.path !== null) {
    return { ...acc, charCount: acc.charCount + countAddedChars(line) }
  }

  return acc
}

/**
 * Parses a unified diff string and returns per-file character counts for added lines.
 * Excludes files matching the exclusion patterns.
 * Only counts lines starting with '+' (not '+++' headers).
 */
export function estimateCost(
  diffOutput: string,
  excludePatterns?: RegExp[]
): FileStats[] {
  if (diffOutput.trim() === '') return []

  const patterns = excludePatterns ?? []
  const lines = diffOutput.split('\n')
  const results: FileStats[] = []
  const initialAcc: FileDiffAccumulator = { path: null, charCount: 0 }

  const finalAcc = lines.reduce(
    (acc, line) => processLine(acc, results, patterns, line),
    initialAcc
  )

  if (finalAcc.path !== null) {
    flushFile(finalAcc.path, finalAcc.charCount, patterns, results)
  }

  return results
}
