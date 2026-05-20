// __SCAFFOLD__ = true
import type { FileCategory } from './types.ts'

export const __SCAFFOLD__ = true

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

/**
 * Returns the file category for cost-rate lookup, or null if the file should be excluded.
 * Exclusion takes priority over classification.
 */
export function classifyFile(
  filePath: string,
  excludePatterns?: RegExp[]
): FileCategory | null {
  throw new Error('Not yet implemented — RED scaffold (classify-file)')
}
