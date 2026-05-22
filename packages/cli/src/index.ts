#!/usr/bin/env node --experimental-strip-types
import { program } from 'commander'
import { writeFileSync } from 'node:fs'
import { analyse } from './core/analyse.ts'
import { formatSummary, formatJson } from './core/format.ts'
import { createGitAdapter } from './shell/git-adapter.ts'
import { swoopyEstimator } from './shell/swoopy-estimator-adapter.ts'
import { loadEstimator } from './shell/estimator-loader.ts'
import { loadConfig } from './shell/config-loader.ts'


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
  .option('--estimator <path>', 'Path to a custom estimator module (ESM default export)')
  .action(async (repoPath: string, options) => {
    const sessionGapHours = parseFloat(options.sessionGap)
    const opts = loadConfig(repoPath, {
      sessionGapHours,
      format: options.format,
      output: options.output,
    })

    try {
      const estimator = options.estimator
        ? await loadEstimator(options.estimator)
        : swoopyEstimator

      const result = await analyse(repoPath, opts, {
        git: createGitAdapter(),
        estimator,
      })

      const output = opts.format === 'json'
        ? formatJson(result)
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
