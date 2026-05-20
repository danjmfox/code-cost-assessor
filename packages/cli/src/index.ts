#!/usr/bin/env node --experimental-strip-types
import { program } from 'commander'
import { analyse } from './analyse.ts'

program
  .name('cca')
  .description('Code Cost Assessor — estimate manual effort equivalent for AI-built repositories')
  .version('0.0.1')

program
  .command('analyse <repo-path>')
  .description('Analyse a git repository and show estimated manual effort by session')
  .option('--session-gap <hours>', 'Inter-commit gap (hours) that starts a new session', '3')
  .option('--format <format>', 'Output format: summary | json', 'summary')
  .action(async (repoPath: string, options) => {
    try {
      const output = await analyse(repoPath, {
        sessionGapHours: parseFloat(options.sessionGap),
        format: options.format,
      })
      process.stdout.write(output + '\n')
    } catch (err) {
      process.stderr.write(`Error: ${(err as Error).message}\n`)
      process.exit(1)
    }
  })

program.parse()
