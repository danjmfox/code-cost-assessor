import type { FileCategory } from './types.ts'

// Patterns that should be excluded from cost analysis (lock files, generated assets).
// Mirrors the repomix exclusion list used in HOW-IT-WAS-MADE.md (spike A finding).
export const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /package-lock\.json$/,
  /\.lock$/,
  /^graphify-out\//,
  /^dist\//,
  /^node_modules\//,
  /\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot)$/i,
  /^\.github\//,
]

const isExcluded = (filePath: string, patterns: RegExp[]): boolean =>
  patterns.some(pattern => pattern.test(filePath))

const classifyByExtension = (filePath: string): FileCategory | null => {
  if (/\.(test|spec)\.ts$/.test(filePath)) return 'test'
  if (/^packages\/.*\.ts$/.test(filePath)) return 'source'
  if (/\.md$/.test(filePath)) return 'doc'
  if (/\.json$/.test(filePath)) return 'config'
  return null
}

/**
 * Returns the file category for cost-rate lookup, or null if the file should be excluded.
 * Exclusion takes priority over classification.
 */
export function classifyFile(
  filePath: string,
  excludePatterns?: RegExp[]
): FileCategory | null {
  const patterns = excludePatterns ?? []
  if (isExcluded(filePath, patterns)) return null
  return classifyByExtension(filePath)
}
