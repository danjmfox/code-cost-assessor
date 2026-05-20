// __SCAFFOLD__ = true
import type { Commit } from './types.ts'

export const __SCAFFOLD__ = true

/**
 * Groups commits into sessions by time gap.
 * A new session starts when the gap between consecutive commits exceeds gapSeconds.
 * Returns sessions in chronological order; each session's commits are oldest-first.
 * Edge case: a single commit returns one session with that commit.
 */
export function detectSessions(
  commits: Commit[],
  gapSeconds: number
): Commit[][] {
  throw new Error('Not yet implemented — RED scaffold (detect-sessions)')
}
