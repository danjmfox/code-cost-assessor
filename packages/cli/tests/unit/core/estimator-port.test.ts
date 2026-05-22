/**
 * @feature estimator-port-adapter
 * @US-1 Inject custom estimator via Ports (programmatic)
 *
 * Driving port: analyse(repoPath, opts, ports) — programmatic API
 * All tests skipped — un-skip one at a time in DELIVER TDD cycles.
 *
 * RED reason for all tests: analyse.ts still calls estimateCost directly;
 * ports.estimator is not yet wired. callCount stays 0; totals.note is undefined.
 */
import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { homedir } from 'os'

const SWOOPY = join(homedir(), 'projects', 'swoopy')

describe('Estimator port — programmatic injection (US-1)', () => {

  // AC-1.5: stub estimator is called once per non-merge commit
  // AC-1.3: ports.estimator.estimate(diff) replaces direct estimateCost import
  it('@US-1 stub estimator is called once per commit and output is in session totals', async () => {
    const { analyse } = await import('../../../src/core/analyse.ts')
    const { createGitAdapter } = await import('../../../src/shell/git-adapter.ts')

    const callCount = { value: 0 }
    const stubEstimate = {
      hours: 1,
      tokens: 100,
      breakdown: {
        source: { hours: 1, tokens: 100 },
        test: { hours: 0, tokens: 0 },
        doc: { hours: 0, tokens: 0 },
        config: { hours: 0, tokens: 0 },
      },
      confidence: '±stub',
      note: 'stub-note',
    }
    const stubEstimator = {
      estimate(_diff: string) {
        callCount.value++
        return stubEstimate
      },
    }

    const result = await analyse(SWOOPY, {}, {
      git: createGitAdapter(),
      estimator: stubEstimator,
    } as any)

    // Estimator called once per commit
    expect(callCount.value).toBe(result.totals.commits)
    // Custom note propagated to sessions
    expect(result.sessions[0].effortEstimate.note).toBe('stub-note')
    // Custom note propagated to totals
    expect(result.totals.note).toBe('stub-note')
    // Hours come from stub (1h × commit count)
    expect(result.totals.hours).toBeCloseTo(result.totals.commits, 0)
  })

  // AC-1.4: default swoopyEstimator produces Swoopy methodology note in totals
  it('@US-1 default swoopyEstimator note is propagated to totals.note', async () => {
    const { analyse } = await import('../../../src/core/analyse.ts')
    const { createGitAdapter } = await import('../../../src/shell/git-adapter.ts')
    const { swoopyEstimator } = await import('../../../src/shell/swoopy-estimator-adapter.ts')

    const result = await analyse(SWOOPY, {}, {
      git: createGitAdapter(),
      estimator: swoopyEstimator,
    } as any)

    expect(result.totals.note).toMatch(/Swoopy/)
    expect(result.totals.hours).toBeGreaterThan(0)
  })
})
