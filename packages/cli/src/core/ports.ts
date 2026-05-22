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

// Estimator: driven port for computing effort from a commit diff.
// Implemented by: shell/swoopy-estimator-adapter.ts (default)
// The note field in the returned EffortEstimate is the honesty contract —
// every implementation must describe its methodology there.
export type Estimator = {
  estimate: (diff: string) => import('./types.ts').EffortEstimate
}

export type Ports = {
  git: GitReader
  estimator: Estimator
}
