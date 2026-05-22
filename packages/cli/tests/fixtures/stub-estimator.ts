/**
 * Fixture: valid custom Estimator for --estimator CLI flag tests.
 * Returns a fixed EffortEstimate regardless of diff content.
 * Usage: cca analyse <repo> --estimator ./tests/fixtures/stub-estimator.ts
 */
export default {
  estimate(_diff: string) {
    return {
      hours: 1,
      tokens: 100,
      breakdown: {
        source: { hours: 1, tokens: 100 },
        test: { hours: 0, tokens: 0 },
        doc: { hours: 0, tokens: 0 },
        config: { hours: 0, tokens: 0 },
      },
      confidence: '±stub',
      note: 'Stub estimator — 1h per diff',
    }
  },
}
