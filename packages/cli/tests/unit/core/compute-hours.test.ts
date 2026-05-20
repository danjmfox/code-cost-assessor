/**
 * Unit tests for core/compute-hours.ts
 * All tests are .skip until DELIVER implements the module.
 */
import { describe, it, expect } from 'vitest'
import {
  computeHours,
  CHARS_PER_TOKEN,
  HOURS_PER_DAY,
  THROUGHPUT_RATES,
} from '../../../src/core/compute-hours.ts'
import type { FileStats } from '../../../src/core/types.ts'

function sourceFile(charCount: number): FileStats {
  const tokenCount = charCount / CHARS_PER_TOKEN
  const hours = (tokenCount / THROUGHPUT_RATES.source) * HOURS_PER_DAY
  return { path: 'packages/cli/src/foo.ts', category: 'source', charCount, tokenCount, hours }
}

function testFile(charCount: number): FileStats {
  const tokenCount = charCount / CHARS_PER_TOKEN
  const hours = (tokenCount / THROUGHPUT_RATES.test) * HOURS_PER_DAY
  return { path: 'packages/cli/tests/foo.test.ts', category: 'test', charCount, tokenCount, hours }
}

describe('computeHours', () => {
  it('returns zero hours for empty file stats', () => {
    const estimate = computeHours([])
    expect(estimate.hours).toBe(0)
    expect(estimate.tokens).toBe(0)
  })

  it('formula: tokens = chars / 3.5, hours = (tokens / rate) × 8', () => {
    // 3500 chars of source code = 1000 tokens
    // hours = (1000 / 250) × 8 = 32h
    const estimate = computeHours([sourceFile(3500)])
    expect(estimate.hours).toBeCloseTo(32, 1)
    expect(estimate.tokens).toBeCloseTo(1000, 0)
  })

  it('test files use rate 400 tok/day (higher throughput = fewer hours per token)', () => {
    // 4000 chars of test = 4000/3.5 ≈ 1143 tokens
    // hours = (1143 / 400) × 8 ≈ 22.86h
    const estimate = computeHours([testFile(4000)])
    expect(estimate.hours).toBeCloseTo((4000 / 3.5 / 400) * 8, 1)
  })

  it('breakdown includes hours and tokens by category', () => {
    const estimate = computeHours([sourceFile(3500), testFile(4000)])
    expect(estimate.breakdown.source.hours).toBeGreaterThan(0)
    expect(estimate.breakdown.test.hours).toBeGreaterThan(0)
    expect(estimate.breakdown.doc.hours).toBe(0)
    expect(estimate.breakdown.config.hours).toBe(0)
  })

  it('confidence is always ±40%', () => {
    const estimate = computeHours([sourceFile(3500)])
    expect(estimate.confidence).toBe('±40%')
  })

  it('note cites the Swoopy methodology', () => {
    const estimate = computeHours([sourceFile(3500)])
    expect(estimate.note).toMatch(/Swoopy/i)
    expect(estimate.note).toMatch(/3\.5/)
    expect(estimate.note).toMatch(/±40%/)
  })

  it('total hours equals sum of breakdown hours across all categories', () => {
    const estimate = computeHours([sourceFile(3500), testFile(4000)])
    const breakdownSum = Object.values(estimate.breakdown).reduce(
      (sum, { hours }) => sum + hours, 0
    )
    expect(estimate.hours).toBeCloseTo(breakdownSum, 5)
  })
})
