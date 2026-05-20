import { execSync } from 'child_process'
import { resolve } from 'path'
import { homedir } from 'os'

const CHARS_PER_TOKEN = 3.5
const HOURS_PER_DAY = 8

// Swoopy token-weighted throughput rates (tokens/day by file category)
// Source: HOW-IT-WAS-MADE.md, Method 2 — Repomix token analysis
const RATES: Record<string, number> = { source: 250, test: 400, doc: 500, config: 600 }

// Mirrors the repomix exclusion list from HOW-IT-WAS-MADE.md.
// Without this, lock files inflate the config category ~20×.
const EXCLUDE: RegExp[] = [
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /package-lock\.json$/,
  /\.lock$/,
  /^graphify-out\//,
  /^dist\//,
  /^node_modules\//,
  /\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot)$/i,
  /^\.github\//,
]

function isExcluded(p: string): boolean {
  return EXCLUDE.some(r => r.test(p))
}

function classify(p: string): string {
  if (/\.(test|spec)\.(ts|tsx|js|jsx|mts)$/.test(p)) return 'test'
  if (/\.(ts|tsx|mts)$/.test(p) && p.includes('packages/')) return 'source'
  if (/\.(md|txt|rst)$/.test(p)) return 'doc'
  return 'config'
}

function hoursFromChars(chars: number, category: string): number {
  return (chars / CHARS_PER_TOKEN / RATES[category]) * HOURS_PER_DAY
}

function parseDiff(diff: string): Record<string, number> {
  const stats: Record<string, number> = {}
  let current: string | null = null
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      current = line.slice(6).trim()
    } else if (line.startsWith('+') && !line.startsWith('+++') && current) {
      stats[current] = (stats[current] ?? 0) + (line.length - 1)
    }
  }
  return stats
}

function git(repoPath: string, args: string): string {
  return execSync(`git ${args}`, {
    cwd: repoPath,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

export type Session = {
  index: number
  startDate: string
  endDate: string
  commits: number
  estimatedHours: number
  confidence: string
}

export type AnalysisResult = {
  repoPath: string
  analysedAt: string
  sessions: Session[]
  totalHours: number
  totalTokens: number
  totalCommits: number
  sessionGapHours: number
  healthDelta: null  // null until Slice 2 (fallow adapter)
}

export type AnalyseOptions = {
  sessionGapHours?: number
  format?: string
}

export async function analyse(repoPath: string, opts: AnalyseOptions = {}): Promise<string> {
  const absPath = resolve(repoPath.replace(/^~/, homedir()))
  const gapS = (opts.sessionGapHours ?? 3) * 3600

  // --no-merges for both session detection and cost analysis.
  // Avoids double-counting branch changes; spike validated ±17% of GT at this setting.
  const logOutput = git(absPath, 'log --no-merges --format="%H %at"').trim()
  if (!logOutput) throw new Error(`No commits found in ${absPath}`)

  const commits = logOutput.split('\n').filter(Boolean).map(l => {
    const [sha, ts] = l.trim().split(' ')
    return { sha, ts: parseInt(ts, 10) }
  }).reverse()

  // Group into sessions by time gap
  const groups: typeof commits[] = []
  let cur: typeof commits = [commits[0]]
  for (let i = 1; i < commits.length; i++) {
    if (commits[i].ts - commits[i - 1].ts > gapS) {
      groups.push(cur)
      cur = [commits[i]]
    } else {
      cur.push(commits[i])
    }
  }
  groups.push(cur)

  const sessions: Session[] = []
  let totalHours = 0
  let totalTokens = 0

  for (let si = 0; si < groups.length; si++) {
    const group = groups[si]
    let sessionHours = 0
    let sessionTokens = 0

    for (const commit of group) {
      let diff: string
      try {
        diff = git(absPath, `diff ${commit.sha}~1 ${commit.sha}`)
      } catch {
        continue
      }
      for (const [filePath, chars] of Object.entries(parseDiff(diff))) {
        if (isExcluded(filePath)) continue
        const cat = classify(filePath)
        sessionHours += hoursFromChars(chars, cat)
        sessionTokens += chars / CHARS_PER_TOKEN
      }
    }

    totalHours += sessionHours
    totalTokens += sessionTokens
    const startTs = group[0].ts
    const endTs = group[group.length - 1].ts
    sessions.push({
      index: si + 1,
      startDate: new Date(startTs * 1000).toISOString().slice(0, 10),
      endDate: new Date(endTs * 1000).toISOString().slice(0, 10),
      commits: group.length,
      estimatedHours: sessionHours,
      confidence: '±40%',
    })
  }

  const result: AnalysisResult = {
    repoPath: absPath,
    analysedAt: new Date().toISOString(),
    sessions,
    totalHours,
    totalTokens,
    totalCommits: commits.length,
    sessionGapHours: opts.sessionGapHours ?? 3,
    healthDelta: null,
  }

  return opts.format === 'json' ? JSON.stringify(result, null, 2) : formatSummary(result)
}

function formatSummary(r: AnalysisResult): string {
  const W = 62
  const lines: string[] = [
    'Code Cost Assessor — Session Analysis',
    '═'.repeat(W),
    `Repository: ${r.repoPath}`,
    `Analysed:   ${r.analysedAt.slice(0, 10)}`,
    `Commits:    ${r.totalCommits} (non-merge, grouped with ${r.sessionGapHours}h gap)`,
    '',
    'Session  Date        Commits  Est. Hours  Confidence',
    '─'.repeat(W),
  ]

  for (const s of r.sessions) {
    const date = s.startDate === s.endDate ? s.startDate : s.startDate
    lines.push(
      `${String(s.index).padStart(7)}  ${date.padEnd(10)}  ${String(s.commits).padStart(7)}  ${s.estimatedHours.toFixed(0).padStart(10)}  ${s.confidence}`
    )
  }

  lines.push('─'.repeat(W))
  lines.push(
    `${'TOTAL'.padStart(7)}  ${''.padEnd(10)}  ${String(r.totalCommits).padStart(7)}  ${r.totalHours.toFixed(0).padStart(10)}h ±40%`
  )
  lines.push('')
  lines.push('Methodology: Swoopy token-weighted model')
  lines.push('  Throughput: source 250, test 400, doc 500, config 600 tokens/day')
  lines.push('  Char/token ratio: 1:3.5 | Confidence interval: ±40%')
  lines.push('  Health analysis: unavailable (fallow not configured)')
  lines.push('')

  return lines.join('\n')
}
