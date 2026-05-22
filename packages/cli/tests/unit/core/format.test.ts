/**
 * Unit tests for core/format.ts
 * Driving port: formatSummary(result) and formatJson(result) pure functions.
 */
import { describe, it, expect } from 'vitest'
import type { AnalysisResult } from '../../../src/core/types.ts'
import { formatSummary, formatJson } from '../../../src/core/format.ts'

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const session = {
    sessionIndex: 1,
    startTime: '2024-03-01T09:00:00.000Z',
    endTime: '2024-03-01T17:00:00.000Z',
    durationHours: 8,
    commits: [
      { sha: 'abc1234', timestamp: 1709283600 },
      { sha: 'def5678', timestamp: 1709287200 },
    ],
    effortEstimate: {
      hours: 12.5,
      tokens: 35000,
      breakdown: {
        source: { hours: 8, tokens: 22000 },
        test: { hours: 3, tokens: 10000 },
        doc: { hours: 1, tokens: 2000 },
        config: { hours: 0.5, tokens: 1000 },
      },
      confidence: '±40%',
      note: 'Swoopy token-weighted model',
    },
    healthDelta: null,
  }

  return {
    repoPath: '/repos/my-project',
    analysedAt: '2024-03-15T10:00:00.000Z',
    fromSha: null,
    toSha: null,
    sessions: [session],
    totals: {
      sessions: 1,
      commits: 2,
      hours: 12.5,
      tokens: 35000,
      confidence: '±40%',
      note: 'Swoopy token-weighted model. Throughput: source 250, test 400, doc 500, config 600 tokens/day. Char/token ratio: 1:3.5. Confidence: ±40%.',
    },
    healthDelta: null,
    ...overrides,
  }
}

describe('formatSummary', () => {
  it('includes session table header columns', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/Session/i)
    expect(output).toMatch(/Date/i)
    expect(output).toMatch(/Commits/i)
    expect(output).toMatch(/Est\.\s*Hours/i)
    expect(output).toMatch(/Confidence/i)
  })

  it('shows ±40% on every session row', () => {
    const result = makeResult()
    const output = formatSummary(result)
    const sessionRows = output.split('\n').filter(l => /^\s+\d+\s+\d{4}-\d{2}-\d{2}/.test(l))
    expect(sessionRows.length).toBeGreaterThan(0)
    for (const row of sessionRows) {
      expect(row).toMatch(/±40%/)
    }
  })

  it('includes Methodology section citing Swoopy model', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/Methodology:\s+Swoopy token-weighted model/i)
  })

  it('shows throughput rates for all file categories', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/source\s+250/i)
    expect(output).toMatch(/test\s+400/i)
    expect(output).toMatch(/doc\s+500/i)
    expect(output).toMatch(/config\s+600/i)
    expect(output).toMatch(/tokens\/day/i)
  })

  it('states ±40% confidence interval explicitly', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/±40%/)
  })

  it('cites 1:3.5 character-to-token ratio', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/1:3\.5|char\/token.*3\.5|3\.5.*char\/token/i)
  })

  it('includes TOTAL row', () => {
    const output = formatSummary(makeResult())
    expect(output).toMatch(/TOTAL/)
  })
})

describe('formatJson', () => {
  it('emits valid JSON that can be parsed', () => {
    const output = formatJson(makeResult())
    expect(() => JSON.parse(output)).not.toThrow()
  })

  it('parsed JSON contains sessions array', () => {
    const output = formatJson(makeResult())
    const parsed = JSON.parse(output)
    expect(Array.isArray(parsed.sessions)).toBe(true)
  })

  it('parsed JSON contains totals object', () => {
    const output = formatJson(makeResult())
    const parsed = JSON.parse(output)
    expect(typeof parsed.totals).toBe('object')
    expect(parsed.totals).not.toBeNull()
  })
})
