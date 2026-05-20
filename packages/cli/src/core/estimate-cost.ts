// __SCAFFOLD__ = true
import type { FileStats } from './types.ts'

export const __SCAFFOLD__ = true

/**
 * Parses a unified diff string and returns per-file character counts for added lines.
 * Excludes files matching the exclusion patterns.
 * Only counts lines starting with '+' (not '+++' headers).
 */
export function estimateCost(
  diffOutput: string,
  excludePatterns?: RegExp[]
): FileStats[] {
  throw new Error('Not yet implemented — RED scaffold (estimate-cost)')
}
