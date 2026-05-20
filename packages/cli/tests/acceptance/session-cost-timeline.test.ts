/**
 * @US-1 Session Cost Timeline — acceptance tests
 * Driving port: cca analyse <repo-path> (CLI subprocess)
 * Strategy C: real adapters, real git repo (~/projects/swoopy)
 *
 * Walking skeleton already covers: AC-1.1 (exit 0), AC-1.2 (table visible),
 * AC-1.3 (total hours plausible), AC-1.4 (estimates labelled), AC-1.6 (methodology).
 *
 * These tests add: AC-1.2 (column check), AC-1.5 (--session-gap config).
 */
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'

const CLI = join(import.meta.dirname, '../../src/index.ts')
const SWOOPY = join(homedir(), 'projects', 'swoopy')

function runCca(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(
      `node --experimental-strip-types ${CLI} ${args}`,
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
    )
    return { stdout, stderr: '', exitCode: 0 }
  } catch (err: any) {
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: err.status ?? 1 }
  }
}

describe('cca analyse — session cost timeline (US-1)', () => {
  // AC-1.2: session table has required columns
  it('@real-io session table includes all required columns', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    // Must have header with all four columns
    expect(stdout).toMatch(/Session/i)
    expect(stdout).toMatch(/Date/i)
    expect(stdout).toMatch(/Commits/i)
    expect(stdout).toMatch(/Est\.\s+Hours/i)
    expect(stdout).toMatch(/Confidence/i)
  })

  // AC-1.4: all estimates labelled as estimates
  it('@real-io confidence column shows ±40% on every session row', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    const sessionRows = stdout.split('\n').filter(l => /^\s+\d+\s+\d{4}-\d{2}-\d{2}/.test(l))
    expect(sessionRows.length).toBeGreaterThan(5)
    for (const row of sessionRows) {
      expect(row).toMatch(/±40%/)
    }
  })

  // AC-1.5: --session-gap 1 produces more sessions than default 3h
  it('@real-io @driving_adapter --session-gap 1 produces more sessions than default', () => {
    const { stdout: default3h } = runCca(`analyse ${SWOOPY}`)
    const { stdout: gap1h } = runCca(`analyse ${SWOOPY} --session-gap 1`)

    const countSessions = (out: string) =>
      out.split('\n').filter(l => /^\s+\d+\s+\d{4}-\d{2}-\d{2}/.test(l)).length

    expect(countSessions(gap1h)).toBeGreaterThan(countSessions(default3h))
  })

  // AC-1.5: --session-gap 4 produces fewer sessions than default 3h
  it('@real-io --session-gap 4 produces fewer sessions than default', () => {
    const { stdout: default3h } = runCca(`analyse ${SWOOPY}`)
    const { stdout: gap4h } = runCca(`analyse ${SWOOPY} --session-gap 4`)

    const countSessions = (out: string) =>
      out.split('\n').filter(l => /^\s+\d+\s+\d{4}-\d{2}-\d{2}/.test(l)).length

    expect(countSessions(gap4h)).toBeLessThan(countSessions(default3h))
  })
})
