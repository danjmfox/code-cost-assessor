import { execSync } from 'node:child_process'
import type { GitReader, LogOpts } from '../core/ports.ts'

const MAX_BUFFER = 64 * 1024 * 1024

function buildLogArgs(opts: LogOpts): string {
  const noMergesFlag = opts.noMerges ? '--no-merges ' : ''
  const format = opts.format ?? '%H %at %s'
  return `${noMergesFlag}--format="${format}"`
}

function readLog(repoPath: string, opts: LogOpts): string {
  const args = buildLogArgs(opts)
  return execSync(`git log ${args}`, {
    cwd: repoPath,
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
  })
}

function readDiff(repoPath: string, sha: string): string {
  try {
    return execSync(`git diff ${sha}~1 ${sha}`, {
      cwd: repoPath,
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('unknown revision') || message.includes('ambiguous argument')) {
      return ''
    }
    throw new Error(`git diff failed for ${sha}: ${message}`)
  }
}

export function createGitAdapter(): GitReader {
  return { readLog, readDiff }
}
