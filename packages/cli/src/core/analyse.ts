// __SCAFFOLD__ = true
// Pure orchestrator: accepts ports, returns AnalysisResult. No I/O.
import type { AnalyseOptions, AnalysisResult } from './types.ts'
import type { Ports } from './ports.ts'

export const __SCAFFOLD__ = true

/**
 * Core analysis pipeline: git reading → session detection → cost estimation → result.
 * Accepts GitReader and HealthReader ports via parameter injection (DDD-1, ADR-02).
 * No I/O: all side effects happen in the port adapters.
 *
 * Two git log strategies (DDD-4):
 *  - Session detection: all commits (including merges) — closer to human-perceived count
 *  - Cost estimation: --no-merges commits — avoids double-counting branch changes
 */
export async function analyse(
  repoPath: string,
  opts: AnalyseOptions,
  ports: Ports
): Promise<AnalysisResult> {
  throw new Error('Not yet implemented — RED scaffold (core/analyse)')
}
