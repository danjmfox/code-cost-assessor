import type { FileStats, EffortEstimate, FileCategory, CategoryBreakdown } from './types.ts'

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

const CATEGORIES: FileCategory[] = ['source', 'test', 'doc', 'config']

function emptyBreakdown(): CategoryBreakdown {
  return Object.fromEntries(
    CATEGORIES.map((category) => [category, { hours: 0, tokens: 0 }])
  ) as CategoryBreakdown
}

function accumulateBreakdown(breakdown: CategoryBreakdown, file: FileStats): CategoryBreakdown {
  const existing = breakdown[file.category]
  return {
    ...breakdown,
    [file.category]: {
      hours: existing.hours + file.hours,
      tokens: existing.tokens + file.tokenCount,
    },
  }
}

/**
 * Computes effort estimate from a list of file stats.
 * Uses pre-computed tokenCount and hours from each FileStats entry.
 * Aggregates totals and produces a per-category breakdown.
 */
export function computeHours(fileStats: FileStats[]): EffortEstimate {
  const breakdown = fileStats.reduce(accumulateBreakdown, emptyBreakdown())

  const totals = Object.values(breakdown).reduce(
    (acc, { hours, tokens }) => ({ hours: acc.hours + hours, tokens: acc.tokens + tokens }),
    { hours: 0, tokens: 0 }
  )

  return {
    hours: totals.hours,
    tokens: totals.tokens,
    breakdown,
    confidence: '±40%',
    note: METHODOLOGY_NOTE,
  }
}
