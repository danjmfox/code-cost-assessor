/**
 * @feature estimator-port-adapter
 * @US-2 CLI --estimator flag
 *
 * Driving port: cca analyse <repo> [--estimator <path>] (CLI subprocess)
 * Strategy: real adapters, real git repo (~/projects/swoopy)
 *
 * Active tests: regression guard (default path unchanged — currently passing).
 * Skipped tests: new behaviour — un-skip one at a time in DELIVER TDD cycles.
 *
 * DELIVER constraint: existing methodology.test.ts assertions must continue to
 * pass after the port extraction. swoopyEstimator.estimate() must return a note
 * that formats to the same "Methodology: Swoopy token-weighted model" output.
 */
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'

const CLI = join(import.meta.dirname, '../../src/index.ts')
const SWOOPY = join(homedir(), 'projects', 'swoopy')
const STUB_ESTIMATOR = join(import.meta.dirname, '../fixtures/stub-estimator.ts')
const MALFORMED_ESTIMATOR = join(import.meta.dirname, '../fixtures/malformed-estimator.ts')
const THROWING_ESTIMATOR = join(import.meta.dirname, '../fixtures/throwing-estimator.ts')

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

describe('cca analyse — estimator port adapter', () => {

  // ── Active: regression guard (AC-2.4) ────────────────────────────────────
  // Default path (no --estimator) must continue to produce Swoopy methodology.
  // This test is GREEN now and must stay GREEN after the port extraction.
  it('@walking_skeleton @real-io default (no --estimator) preserves Swoopy methodology note', () => {
    const { stdout, exitCode } = runCca(`analyse ${SWOOPY}`)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Swoopy token-weighted model/)
    expect(stdout).toMatch(/±40%/)
  })

  // ── Skipped: new behaviour (un-skip in DELIVER TDD cycles) ───────────────

  // AC-2.3: custom estimator note appears in summary output
  it('@US-2 @real-io @driving_adapter custom estimator note appears in summary output', () => {
    const { stdout, exitCode } = runCca(`analyse ${SWOOPY} --estimator "${STUB_ESTIMATOR}"`)
    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/Stub estimator — 1h per diff/)
    expect(stdout).not.toMatch(/Swoopy token-weighted model/)
  })

  // AC-2.3 (JSON variant): custom note in totals.note field of JSON output
  it('@US-2 @real-io custom estimator note appears in JSON totals.note', () => {
    const { stdout, exitCode } = runCca(`analyse ${SWOOPY} --estimator "${STUB_ESTIMATOR}" --format json`)
    expect(exitCode).toBe(0)
    const json = JSON.parse(stdout)
    expect(json.totals.note).toBe('Stub estimator — 1h per diff')
    expect(json.totals.note).not.toMatch(/Swoopy/)
  })

  // AC-2.2: malformed export exits 1 with descriptive error naming expected shape
  it('@US-2 @error malformed estimator export exits 1 with descriptive error', () => {
    const { stderr, exitCode } = runCca(`analyse ${SWOOPY} --estimator "${MALFORMED_ESTIMATOR}"`)
    expect(exitCode).toBe(1)
    // Error must name the expected shape so developer knows what to export
    expect(stderr).toMatch(/estimator/i)
    expect(stderr).toMatch(/estimate/i)
  })

  // AC-2.2 (not found variant): non-existent file exits 1
  it('@US-2 @error non-existent estimator file exits 1', () => {
    const { stderr, exitCode } = runCca(`analyse ${SWOOPY} --estimator ./does-not-exist.js`)
    expect(exitCode).toBe(1)
    expect(stderr).toBeTruthy()
  })

  // AC-2.6: estimator throws at runtime → exits 1, no silent Swoopy fallback
  it('@US-2 @error runtime estimator failure exits 1 with no Swoopy fallback', () => {
    const { stdout, stderr, exitCode } = runCca(`analyse ${SWOOPY} --estimator "${THROWING_ESTIMATOR}"`)
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/Estimator failed intentionally/)
    // Must NOT silently fall back to Swoopy output
    expect(stdout).not.toMatch(/Swoopy token-weighted model/)
  })
})
