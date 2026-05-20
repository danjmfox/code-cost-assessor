import { resolve } from 'node:path'
import { homedir } from 'node:os'
import type { AnalyseOptions, AnalysisResult, Session, Totals, Commit } from './types.ts'
import type { Ports } from './ports.ts'
import { parseCommits } from './parse-commits.ts'
import { detectSessions } from './detect-sessions.ts'
import { estimateCost } from './estimate-cost.ts'
import { computeHours } from './compute-hours.ts'
import { DEFAULT_EXCLUDE_PATTERNS } from './classify-file.ts'

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

  const allFileStats = (
    await Promise.all(
      group.map(async (commit) => {
        const diff = ports.git.readDiff(absPath, commit.sha)
        return estimateCost(diff, DEFAULT_EXCLUDE_PATTERNS)
      })
    )
  ).flat()

  const effortEstimate = computeHours(allFileStats)

  return {
    sessionIndex,
    startTime,
    endTime,
    durationHours,
    commits: group,
    effortEstimate,
    healthDelta: null,
  }
}

function computeTotals(sessions: Session[]): Totals {
  const totalCommits = sessions.reduce((sum, s) => sum + s.commits.length, 0)
  const totalHours = sessions.reduce((sum, s) => sum + s.effortEstimate.hours, 0)
  const totalTokens = sessions.reduce((sum, s) => sum + s.effortEstimate.tokens, 0)
  return {
    sessions: sessions.length,
    commits: totalCommits,
    hours: totalHours,
    tokens: totalTokens,
    confidence: '±40%',
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
    healthDelta: null,
  }
}
