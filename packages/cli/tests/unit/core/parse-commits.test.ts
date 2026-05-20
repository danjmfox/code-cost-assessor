/**
 * Unit tests for core/parse-commits.ts
 * All tests are .skip until DELIVER implements the module.
 * Remove .skip one at a time per TDD cycle.
 */
import { describe, it, expect } from 'vitest'
import { parseCommits } from '../../../src/core/parse-commits.ts'

describe('parseCommits', () => {
  it.skip('parses a single commit from git log output', () => {
    const logLine = 'abc123 1714000000 feat: add session detection'
    const result = parseCommits(logLine)
    expect(result).toHaveLength(1)
    expect(result[0].sha).toBe('abc123')
    expect(result[0].timestamp).toBe(1714000000)
    expect(result[0].message).toBe('feat: add session detection')
  })

  it.skip('returns commits in chronological order (oldest first)', () => {
    const logOutput = [
      'sha3 1714000200 third commit',
      'sha2 1714000100 second commit',
      'sha1 1714000000 first commit',
    ].join('\n')
    const result = parseCommits(logOutput)
    expect(result[0].sha).toBe('sha1')
    expect(result[1].sha).toBe('sha2')
    expect(result[2].sha).toBe('sha3')
  })

  it.skip('returns empty array for empty input', () => {
    expect(parseCommits('')).toHaveLength(0)
    expect(parseCommits('   ')).toHaveLength(0)
  })

  it.skip('ignores malformed lines that cannot be parsed', () => {
    const logOutput = 'bad-line\nabc123 1714000000 good commit'
    const result = parseCommits(logOutput)
    expect(result).toHaveLength(1)
    expect(result[0].sha).toBe('abc123')
  })
})
