/**
 * Fixture: Estimator that throws at runtime.
 * Used to test AC-2.6: runtime estimator failure exits 1 (no silent fallback to Swoopy).
 */
export default {
  estimate(_diff: string): never {
    throw new Error('Estimator failed intentionally')
  },
}
