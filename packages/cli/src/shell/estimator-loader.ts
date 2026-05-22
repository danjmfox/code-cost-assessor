import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { Estimator } from '../core/ports.ts'

export async function loadEstimator(path: string): Promise<Estimator> {
  const abs = resolve(path)

  if (!existsSync(abs)) {
    throw new Error(`Estimator file not found: ${abs}`)
  }

  const mod = await import(abs)
  const exported = mod.default

  if (
    typeof exported !== 'object' ||
    exported === null ||
    typeof exported.estimate !== 'function'
  ) {
    throw new Error(
      `Invalid estimator module at ${abs}: expected a default export with shape { estimate(diff: string): EffortEstimate }`
    )
  }

  return exported as Estimator
}
