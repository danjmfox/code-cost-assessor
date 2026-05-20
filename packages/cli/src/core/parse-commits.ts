import type { Commit } from './types.ts'

function parseLine(line: string): Commit | null {
  const parts = line.trim().split(' ')
  if (parts.length < 2) return null
  const [sha, rawTimestamp, ...messageParts] = parts
  const timestamp = Number(rawTimestamp)
  if (!sha || !Number.isInteger(timestamp) || isNaN(timestamp)) return null
  const message = messageParts.length > 0 ? messageParts.join(' ') : undefined
  return { sha, timestamp, message }
}

function isNonBlank(line: string): boolean {
  return line.trim().length > 0
}

/**
 * Parses `git log --format="%H %at %s"` output into Commit objects.
 * Returns commits in chronological order (oldest first).
 */
export function parseCommits(logOutput: string): Commit[] {
  const parsed = logOutput
    .split('\n')
    .filter(isNonBlank)
    .map(parseLine)
    .filter((commit): commit is Commit => commit !== null)
  return parsed.reverse()
}
