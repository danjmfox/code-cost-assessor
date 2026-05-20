/**
 * @walking_skeleton @driving_port
 *
 * Walking skeleton acceptance test for ai-dev-cost-health-analyser.
 * Exercises the full path: CLI entry → git reading → session detection
 * → cost estimation → formatted output.
 *
 * Fixture: ~/projects/swoopy (validated in spikes A + D)
 * Ground truth: 4,725h total (±40% band: 2,835h–6,615h)
 */
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'

const CLI = join(import.meta.dirname, '../../src/index.ts')
const SWOOPY = join(homedir(), 'projects', 'swoopy')

function runCca(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(
      `node --experimental-strip-types ${CLI} ${args}`,
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
    )
    return { stdout, exitCode: 0 }
  } catch (err: any) {
    return { stdout: err.stdout ?? '', exitCode: err.status ?? 1 }
  }
}

describe('cca analyse — walking skeleton', () => {
  // AC-1.1: exits 0 on a valid git repository
  it('exits 0 on a valid git repository', () => {
    const { exitCode } = runCca(`analyse ${SWOOPY}`)
    expect(exitCode).toBe(0)
  })

  // AC-1.2: output shows a session table with required columns
  it('output shows a session table with commits and estimated hours', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/Session\s+Date\s+Commits\s+Est\. Hours/)
    expect(stdout).toMatch(/TOTAL/)
    // At least one session row (digit in session column)
    expect(stdout).toMatch(/^\s+\d+\s+\d{4}-\d{2}-\d{2}/m)
  })

  // AC-1.3: totals block shows a plausible total hours figure
  // The full Swoopy repo has grown beyond the original 18-session HOW-IT-WAS-MADE.md window
  // (4,725h ±40% GT). The full-repo total will be higher; sanity bounds: 3,000h–20,000h.
  it('total hours is a plausible non-zero figure', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    const match = stdout.match(/TOTAL.*?(\d{3,6})h/)
    expect(match).not.toBeNull()
    const totalHours = parseInt(match![1], 10)
    expect(totalHours).toBeGreaterThan(3000)
    expect(totalHours).toBeLessThan(20000)
  })

  // AC-1.6 / AC-4.1: methodology section appears in output
  it('output includes methodology citation', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/Methodology: Swoopy token-weighted model/)
    expect(stdout).toMatch(/±40%/)
  })

  // AC-2.1: --format json emits valid JSON conforming to AnalysisResult shape
  it('--format json emits valid JSON with sessions array and totals', () => {
    const { stdout, exitCode } = runCca(`analyse ${SWOOPY} --format json`)
    expect(exitCode).toBe(0)
    const json = JSON.parse(stdout)
    expect(Array.isArray(json.sessions)).toBe(true)
    expect(json.sessions.length).toBeGreaterThan(10)
    expect(typeof json.totalHours).toBe('number')
    expect(typeof json.totalTokens).toBe('number')
    expect(json.healthDelta).toBeNull()

    // Each session must have the required shape
    const s = json.sessions[0]
    expect(s).toHaveProperty('index')
    expect(s).toHaveProperty('startDate')
    expect(s).toHaveProperty('estimatedHours')
    expect(s).toHaveProperty('confidence', '±40%')
    expect(s.estimatedHours).toBeGreaterThanOrEqual(0)
  })

  // AC-1.1 (negative): exits non-zero on a non-git directory
  it('exits non-zero on a non-git directory', () => {
    const { exitCode } = runCca('analyse /tmp')
    expect(exitCode).not.toBe(0)
  })
})
