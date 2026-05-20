// __SCAFFOLD__ = true
import type { GitReader, LogOpts } from '../core/ports.ts'

export const __SCAFFOLD__ = true

/**
 * Implements GitReader using child_process.execSync.
 * ADR-03: execSync over simple-git — no dependency cost, spike validated.
 *
 * readDiff: returns empty string for the root commit (no parent).
 * readLog: applies --no-merges and format string from opts.
 */
export function createGitAdapter(): GitReader {
  throw new Error('Not yet implemented — RED scaffold (shell/git-adapter)')
}
