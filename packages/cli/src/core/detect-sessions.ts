import type { Commit } from './types.ts'

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
  if (commits.length === 0) return []

  const [firstCommit, ...remainingCommits] = commits

  return remainingCommits.reduce<Commit[][]>((sessions, currentCommit) => {
    const lastSession = sessions[sessions.length - 1]
    const lastCommit = lastSession[lastSession.length - 1]
    const gapFromPrevious = currentCommit.timestamp - lastCommit.timestamp

    if (gapFromPrevious > gapSeconds) {
      return [...sessions, [currentCommit]]
    }

    const updatedLastSession = [...lastSession, currentCommit]
    return [...sessions.slice(0, -1), updatedLastSession]
  }, [[firstCommit]])
}
