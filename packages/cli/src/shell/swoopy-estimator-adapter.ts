import { estimateCost } from '../core/estimate-cost.ts'
import { computeHours } from '../core/compute-hours.ts'
import { DEFAULT_EXCLUDE_PATTERNS } from '../core/classify-file.ts'
import type { Estimator } from '../core/ports.ts'

export const swoopyEstimator: Estimator = {
  estimate(diff: string) {
    const fileStats = estimateCost(diff, DEFAULT_EXCLUDE_PATTERNS)
    return computeHours(fileStats)
  },
}
