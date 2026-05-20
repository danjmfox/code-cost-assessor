// __SCAFFOLD__ = true
import type { Commit } from './types.ts'

export const __SCAFFOLD__ = true

/**
 * Parses `git log --format="%H %at %s"` output into Commit objects.
 * Returns commits in chronological order (oldest first).
 */
export function parseCommits(logOutput: string): Commit[] {
  throw new Error('Not yet implemented — RED scaffold (parse-commits)')
}
