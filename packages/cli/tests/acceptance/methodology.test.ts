/**
 * @US-4 Reproducible Methodology — acceptance tests
 * Driving port: cca analyse <repo-path> (CLI subprocess)
 * Strategy C: real adapters, real git repo.
 *
 * AC-4.1–4.4 are already implemented in the current skeleton.
 * These tests confirm the behavior and serve as regression guards during DELIVER refactor.
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

describe('cca analyse — reproducible methodology (US-4)', () => {
  // AC-4.1: summary includes Methodology section citing Swoopy model
  it('@real-io AC-4.1: output includes a Methodology section', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/Methodology:\s+Swoopy token-weighted model/i)
  })

  // AC-4.2: throughput rates shown in output
  it('@real-io AC-4.2: throughput rates (tokens/day per category) are shown', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/source\s+250/i)
    expect(stdout).toMatch(/test\s+400/i)
    expect(stdout).toMatch(/doc\s+500/i)
    expect(stdout).toMatch(/config\s+600/i)
    expect(stdout).toMatch(/tokens\/day/i)
  })

  // AC-4.3: ±40% confidence interval stated
  it('@real-io AC-4.3: ±40% confidence interval is stated explicitly', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/±40%/)
  })

  // AC-4.4: char/token ratio cited
  it('@real-io AC-4.4: 1:3.5 character-to-token ratio is cited', () => {
    const { stdout } = runCca(`analyse ${SWOOPY}`)
    expect(stdout).toMatch(/1:3\.5|char\/token.*3\.5|3\.5.*char\/token/i)
  })

  // Regression: methodology section must survive DELIVER refactor of core/format.ts
  it('@real-io methodology section appears on every run (regression guard)', () => {
    const run1 = runCca(`analyse ${SWOOPY}`)
    const run2 = runCca(`analyse ${SWOOPY}`)
    expect(run1.stdout).toMatch(/Methodology/)
    expect(run2.stdout).toMatch(/Methodology/)
    // Reproducibility: same repo → same total hours (to nearest integer)
    const extract = (out: string) => {
      const m = out.match(/TOTAL.*?(\d{3,6})h/)
      return m ? parseInt(m[1], 10) : -1
    }
    expect(extract(run1.stdout)).toBe(extract(run2.stdout))
  })
})
