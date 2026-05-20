// __SCAFFOLD__ = true
import type { FileStats, EffortEstimate, FileCategory } from './types.ts'

export const __SCAFFOLD__ = true

export const CHARS_PER_TOKEN = 3.5
export const HOURS_PER_DAY = 8

// Swoopy token-weighted throughput rates (tokens/day by file category).
// Source: HOW-IT-WAS-MADE.md, Method 2 — Repomix token analysis.
export const THROUGHPUT_RATES: Record<FileCategory, number> = {
  source: 250,
  test: 400,
  doc: 500,
  config: 600,
}

export const METHODOLOGY_NOTE =
  'Swoopy token-weighted model. Throughput: source 250, test 400, doc 500, config 600 tokens/day. ' +
  'Char/token ratio: 1:3.5. Confidence: ±40%.'

/**
 * Computes effort estimate from a list of file stats.
 * Formula: tokens = charCount / CHARS_PER_TOKEN
 *          hours  = (tokens / rate) × HOURS_PER_DAY
 */
export function computeHours(fileStats: FileStats[]): EffortEstimate {
  throw new Error('Not yet implemented — RED scaffold (compute-hours)')
}
