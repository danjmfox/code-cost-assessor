import { resolve } from 'node:path'
import { homedir } from 'node:os'
import type { AnalyseOptions, AnalysisResult, Session, Totals, Commit } from './types.ts'
import type { Ports } from './ports.ts'
import { parseCommits } from './parse-commits.ts'
import { detectSessions } from './detect-sessions.ts'

function resolveAbsPath(repoPath: string): string {
  return resolve(repoPath.replace(/^~/, homedir()))
}

function toIso(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toISOString()
}

function computeDurationHours(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000
}

async function buildSession(
  sessionIndex: number,
  group: Commit[],
  absPath: string,
  ports: Ports
): Promise<Session> {
  const startTime = toIso(group[0].timestamp)
  const endTime = toIso(group[group.length - 1].timestamp)
  const durationHours = computeDurationHours(startTime, endTime)

  const estimates = await Promise.all(
    group.map(async (commit) => {
      const diff = ports.git.readDiff(absPath, commit.sha)
      return ports.estimator.estimate(diff)
    })
  )

  const effortEstimate = estimates.reduce(
    (acc, est) => ({
      hours: acc.hours + est.hours,
      tokens: acc.tokens + est.tokens,
      breakdown: {
        source: { hours: acc.breakdown.source.hours + est.breakdown.source.hours, tokens: acc.breakdown.source.tokens + est.breakdown.source.tokens },
        test:   { hours: acc.breakdown.test.hours   + est.breakdown.test.hours,   tokens: acc.breakdown.test.tokens   + est.breakdown.test.tokens   },
        doc:    { hours: acc.breakdown.doc.hours     + est.breakdown.doc.hours,     tokens: acc.breakdown.doc.tokens     + est.breakdown.doc.tokens     },
        config: { hours: acc.breakdown.config.hours  + est.breakdown.config.hours,  tokens: acc.breakdown.config.tokens  + est.breakdown.config.tokens  },
      },
      confidence: est.confidence,
      note: est.note,
    }),
    { hours: 0, tokens: 0, breakdown: { source: { hours: 0, tokens: 0 }, test: { hours: 0, tokens: 0 }, doc: { hours: 0, tokens: 0 }, config: { hours: 0, tokens: 0 } }, confidence: '±40%', note: '' }
  )

  return {
    sessionIndex,
    startTime,
    endTime,
    durationHours,
    commits: group,
    effortEstimate,
  }
}

function computeTotals(sessions: Session[]): Totals {
  const totalCommits = sessions.reduce((sum, s) => sum + s.commits.length, 0)
  const totalHours = sessions.reduce((sum, s) => sum + s.effortEstimate.hours, 0)
  const totalTokens = sessions.reduce((sum, s) => sum + s.effortEstimate.tokens, 0)
  const note = sessions[0]?.effortEstimate.note ?? ''
  return {
    sessions: sessions.length,
    commits: totalCommits,
    hours: totalHours,
    tokens: totalTokens,
    confidence: '±40%',
    note,
  }
}

export async function analyse(
  repoPath: string,
  opts: AnalyseOptions,
  ports: Ports
): Promise<AnalysisResult> {
  const absPath = resolveAbsPath(repoPath)
  const gapSeconds = (opts.sessionGapHours ?? 3) * 3600

  const logOutput = ports.git.readLog(absPath, { noMerges: true, format: '%H %at %s' })
  if (!logOutput.trim()) {
    throw new Error(`No commits found in ${absPath}`)
  }

  const commits = parseCommits(logOutput)
  const sessionGroups = detectSessions(commits, gapSeconds)

  const sessions = await Promise.all(
    sessionGroups.map((group, i) => buildSession(i + 1, group, absPath, ports))
  )

  const totals = computeTotals(sessions)

  return {
    repoPath: absPath,
    analysedAt: new Date().toISOString(),
    fromSha: commits.length > 0 ? commits[0].sha : null,
    toSha: commits.length > 0 ? commits[commits.length - 1].sha : null,
    sessions,
    totals,
  }
}
