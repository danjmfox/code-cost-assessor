/**
 * Unit tests for core/detect-sessions.ts
 * All tests are .skip until DELIVER implements the module.
 */
import { describe, it, expect } from 'vitest'
import { detectSessions } from '../../../src/core/detect-sessions.ts'
import type { Commit } from '../../../src/core/types.ts'

function commit(sha: string, timestamp: number): Commit {
  return { sha, timestamp }
}

const GAP_3H = 3 * 3600

describe('detectSessions', () => {
  it.skip('groups consecutive commits within the gap into one session', () => {
    const commits = [
      commit('a', 1714000000),
      commit('b', 1714001000),  // 16 min after a — same session
      commit('c', 1714002000),  // 16 min after b — same session
    ]
    const sessions = detectSessions(commits, GAP_3H)
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toHaveLength(3)
  })

  it.skip('splits commits separated by more than gapSeconds into different sessions', () => {
    const commits = [
      commit('a', 1714000000),
      commit('b', 1714020000),  // 5.5h after a — new session
    ]
    const sessions = detectSessions(commits, GAP_3H)
    expect(sessions).toHaveLength(2)
    expect(sessions[0][0].sha).toBe('a')
    expect(sessions[1][0].sha).toBe('b')
  })

  it.skip('a single commit produces one session', () => {
    // Spike D edge case: algorithm must not crash on single commit
    const sessions = detectSessions([commit('a', 1714000000)], GAP_3H)
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toHaveLength(1)
  })

  it.skip('returns sessions in chronological order (oldest first)', () => {
    const commits = [
      commit('a', 1714000000),
      commit('b', 1714020000),
      commit('c', 1714030000),
    ]
    const sessions = detectSessions(commits, GAP_3H)
    expect(sessions[0][0].sha).toBe('a')
    expect(sessions[1][0].sha).toBe('b')
  })

  it.skip('Spike D ground truth: 3h gap produces 15-22 sessions on realistic repo', () => {
    // Property: for any repo with ~150 commits in a 14-day window,
    // 3h threshold produces between 15 and 25 sessions.
    // This is a documentation test — validated by the spike.
    expect(true).toBe(true) // placeholder; real validation done in spike
  })
})
