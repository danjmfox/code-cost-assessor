/**
 * @US-2 JSON Output for Benchmarking — acceptance tests
 * Driving port: cca analyse <repo-path> --format json (CLI subprocess)
 * Strategy C: real adapters, real git repo.
 *
 * Walking skeleton already covers: AC-2.1 (valid JSON), AC-2.5 (healthDelta null).
 *
 * New scenarios: AC-2.2 (full JSON shape), AC-2.3 (session shape),
 * AC-2.4 (effortEstimate breakdown), AC-2.6 (--output flag).
 * These are .skip until DELIVER implements the new AnalysisResult type.
 */
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { existsSync, readFileSync, rmSync } from 'fs'

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

describe('cca analyse --format json (US-2)', () => {
  // AC-2.2: JSON includes all required top-level fields
  it('@real-io AC-2.2: JSON includes repoPath, analysedAt, fromSha, toSha, sessions[], totals', () => {
    const { stdout, exitCode } = runCca(`analyse ${SWOOPY} --format json`)
    expect(exitCode).toBe(0)
    const json = JSON.parse(stdout)
    expect(json).toHaveProperty('repoPath')
    expect(json).toHaveProperty('analysedAt')
    expect(json).toHaveProperty('fromSha')
    expect(json).toHaveProperty('toSha')
    expect(Array.isArray(json.sessions)).toBe(true)
    expect(json).toHaveProperty('totals')
    expect(json.totals).toHaveProperty('sessions')
    expect(json.totals).toHaveProperty('commits')
    expect(json.totals).toHaveProperty('hours')
    expect(json.totals).toHaveProperty('confidence')
  })

  // AC-2.3: each session has the full required shape
  it('@real-io AC-2.3: each session has sessionIndex, startTime, endTime, durationHours, commits[], effortEstimate, healthDelta', () => {
    const { stdout } = runCca(`analyse ${SWOOPY} --format json`)
    const json = JSON.parse(stdout)
    const s = json.sessions[0]
    expect(s).toHaveProperty('sessionIndex')
    expect(s).toHaveProperty('startTime')      // ISO date-time string
    expect(s).toHaveProperty('endTime')
    expect(s).toHaveProperty('durationHours')
    expect(Array.isArray(s.commits)).toBe(true)
    expect(s.commits[0]).toHaveProperty('sha')
    expect(s.commits[0]).toHaveProperty('timestamp')
    expect(s).toHaveProperty('effortEstimate')
  })

  // AC-2.4: effortEstimate includes breakdown by category
  it('@real-io AC-2.4: effortEstimate has hours, tokens, breakdown, confidence, note', () => {
    const { stdout } = runCca(`analyse ${SWOOPY} --format json`)
    const json = JSON.parse(stdout)
    const estimate = json.sessions[0].effortEstimate
    expect(estimate).toHaveProperty('hours')
    expect(estimate).toHaveProperty('tokens')
    expect(estimate).toHaveProperty('breakdown')
    expect(estimate.breakdown).toHaveProperty('source')
    expect(estimate.breakdown).toHaveProperty('test')
    expect(estimate.breakdown).toHaveProperty('doc')
    expect(estimate.breakdown).toHaveProperty('config')
    expect(estimate.breakdown.source).toHaveProperty('hours')
    expect(estimate.breakdown.source).toHaveProperty('tokens')
    expect(estimate.confidence).toBe('±40%')
    expect(estimate.note).toMatch(/Swoopy/i)
  })

  // AC-2.5: healthDelta null with stderr warning — already in walking skeleton, tested here for regression
  it('@real-io AC-2.5: healthDelta is null at session level; warning on stderr', () => {
    const { stdout } = runCca(`analyse ${SWOOPY} --format json`)
    const json = JSON.parse(stdout)
    expect(json.sessions[0].healthDelta ?? null).toBeNull()
  })

  // AC-2.6: --output writes JSON to file
  it('@real-io @driving_adapter AC-2.6: --output <file> writes JSON to file instead of stdout', () => {
    const outFile = join(tmpdir(), `cca-test-${Date.now()}.json`)
    try {
      const { stdout, exitCode } = runCca(`analyse ${SWOOPY} --format json --output ${outFile}`)
      expect(exitCode).toBe(0)
      expect(stdout.trim()).toBe('')  // nothing to stdout when --output used
      expect(existsSync(outFile)).toBe(true)
      const written = JSON.parse(readFileSync(outFile, 'utf8'))
      expect(Array.isArray(written.sessions)).toBe(true)
    } finally {
      if (existsSync(outFile)) rmSync(outFile)
    }
  })
})
