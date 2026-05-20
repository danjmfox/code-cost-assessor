// Core domain types for ai-dev-cost-health-analyser.
// These are the DISCUSS spec-compliant shapes (AC-2.2, AC-2.3, AC-2.4).

export type FileCategory = 'source' | 'test' | 'doc' | 'config'

export type Commit = {
  sha: string
  timestamp: number    // unix epoch seconds
  message?: string
}

export type FileStats = {
  path: string
  category: FileCategory
  charCount: number
  tokenCount: number
  hours: number
}

export type CategoryBreakdown = Record<FileCategory, { hours: number; tokens: number }>

export type EffortEstimate = {
  hours: number
  tokens: number
  breakdown: CategoryBreakdown
  confidence: string   // '±40%'
  note: string         // methodology citation
}

export type HealthDelta = {
  verdict: 'improved' | 'degraded' | 'stable'
  deadCodeIntroduced: number
  complexityIntroduced: number
  duplicationIntroduced: number
} | null

export type Session = {
  sessionIndex: number
  startTime: string        // ISO date-time string
  endTime: string          // ISO date-time string
  durationHours: number
  commits: Commit[]
  effortEstimate: EffortEstimate
  healthDelta: HealthDelta
}

export type Totals = {
  sessions: number
  commits: number
  hours: number
  tokens: number
  confidence: string
}

export type AnalysisResult = {
  repoPath: string
  analysedAt: string       // ISO date-time
  fromSha: string | null
  toSha: string | null
  sessions: Session[]
  totals: Totals
  healthDelta: null         // aggregate; Slice 2
}

export type AnalyseOptions = {
  sessionGapHours?: number
  format?: 'summary' | 'json'
  output?: string          // --output <file>
  noHealth?: boolean       // --no-health
  devRate?: number         // --dev-rate <USD/hr>
}
