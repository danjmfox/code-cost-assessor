// __SCAFFOLD__ = true
import type { AnalyseOptions } from '../core/types.ts'

export const __SCAFFOLD__ = true

/**
 * Merges .ccarc.json (if present) with CLI flags into resolved AnalyseOptions.
 * .ccarc.json may specify additional exclude patterns, default session gap, etc.
 * CLI flags take precedence over .ccarc.json values.
 */
export function loadConfig(
  repoPath: string,
  cliFlags: Partial<AnalyseOptions>
): AnalyseOptions {
  throw new Error('Not yet implemented — RED scaffold (shell/config-loader)')
}
