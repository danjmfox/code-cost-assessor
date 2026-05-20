// __SCAFFOLD__ = true
import type { HealthReader } from '../core/ports.ts'

export const __SCAFFOLD__ = true

/**
 * Stub HealthReader that always returns null.
 * ADR-04: fallow health adapter deferred to Slice 2.
 * D-04: tool MUST function without fallow — null is the correct graceful return.
 *
 * Slice 2 will implement Option C3: snapshot absolute fallow counts at each
 * session end commit and compute delta externally (no checkout needed).
 */
export function createHealthAdapter(): HealthReader {
  return {
    getDelta: (_repoPath, _fromSha, _toSha) => null,
  }
}
