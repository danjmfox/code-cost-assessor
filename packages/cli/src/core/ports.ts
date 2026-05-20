import type { HealthDelta } from './types.ts'

export type LogOpts = {
  noMerges: boolean
  format?: string
}

// GitReader: driven port for reading git history and diffs.
// Implemented by: shell/git-adapter.ts
export type GitReader = {
  readLog: (repoPath: string, opts: LogOpts) => string
  readDiff: (repoPath: string, sha: string) => string   // empty string for root commit
}

// HealthReader: driven port for fallow health delta analysis.
// Returns null when fallow is unavailable (D-04 graceful degradation hard requirement).
// Implemented by: shell/health-adapter.ts (returns null until Slice 2)
export type HealthReader = {
  getDelta: (repoPath: string, fromSha: string, toSha: string) => HealthDelta
}

export type Ports = {
  git: GitReader
  health: HealthReader
}
