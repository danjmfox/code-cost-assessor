#!/usr/bin/env node --experimental-strip-types
import { program } from 'commander'
import { writeFileSync } from 'node:fs'
import { analyse } from './core/analyse.ts'
import { formatSummary, formatJson } from './core/format.ts'
import type { AnalysisResult, Session } from './core/types.ts'
import { createGitAdapter } from './shell/git-adapter.ts'
import { createHealthAdapter } from './shell/health-adapter.ts'
import { loadConfig } from './shell/config-loader.ts'

/**
 * Produces backward-compatible JSON merging new AnalysisResult fields with
 * the old walking-skeleton shape. Preserves AC-2.1 (walking skeleton) while
 * satisfying AC-2.2, AC-2.3, AC-2.4 (new AnalysisResult fields).
 * Both sets of consumers will find their expected fields.
 */
function formatCompatibleJson(result: AnalysisResult): string {
  const sessionsWithCompat = result.sessions.map((s: Session) => ({
    // New fields (AC-2.3, AC-2.4)
    sessionIndex: s.sessionIndex,
    startTime: s.startTime,
    endTime: s.endTime,
    durationHours: s.durationHours,
    commits: s.commits,
    effortEstimate: s.effortEstimate,
    healthDelta: s.healthDelta,
    // Backward-compat fields (AC-2.1 walking skeleton)
    index: s.sessionIndex,
    startDate: s.startTime.slice(0, 10),
    endDate: s.endTime.slice(0, 10),
    estimatedHours: s.effortEstimate.hours,
    confidence: s.effortEstimate.confidence,
  }))

  const merged = {
    // New fields (AC-2.2)
    repoPath: result.repoPath,
    analysedAt: result.analysedAt,
    fromSha: result.fromSha,
    toSha: result.toSha,
    sessions: sessionsWithCompat,
    totals: result.totals,
    healthDelta: result.healthDelta,
    // Backward-compat fields (AC-2.1 walking skeleton)
    totalHours: result.totals.hours,
    totalTokens: result.totals.tokens,
    totalCommits: result.totals.commits,
    sessionGapHours: 3,
  }

  return JSON.stringify(merged, null, 2)
}

program
  .name('cca')
  .description('Code Cost Assessor — estimate manual effort equivalent for AI-built repositories')
  .version('0.0.1')

program
  .command('analyse <repo-path>')
  .description('Analyse a git repository and show estimated manual effort by session')
  .option('--session-gap <hours>', 'Inter-commit gap (hours) that starts a new session', '3')
  .option('--format <format>', 'Output format: summary | json', 'summary')
  .option('--output <file>', 'Write output to file instead of stdout')
  .action(async (repoPath: string, options) => {
    const sessionGapHours = parseFloat(options.sessionGap)
    const opts = loadConfig(repoPath, {
      sessionGapHours,
      format: options.format,
      output: options.output,
    })

    try {
      const result = await analyse(repoPath, opts, {
        git: createGitAdapter(),
        health: createHealthAdapter(),
      })

      const output = opts.format === 'json'
        ? formatCompatibleJson(result)
        : formatSummary(result)

      if (opts.output) {
        writeFileSync(opts.output, output)
      } else {
        process.stdout.write(output + '\n')
      }
    } catch (err) {
      process.stderr.write(`Error: ${(err as Error).message}\n`)
      process.exit(1)
    }
  })

program.parse()
