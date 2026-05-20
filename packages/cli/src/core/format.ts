// __SCAFFOLD__ = true
import type { AnalysisResult } from './types.ts'

export const __SCAFFOLD__ = true

/**
 * Formats an AnalysisResult as a human-readable session table with totals and methodology note.
 * AC-1.2: columns: Session, Date, Commits, Est. Hours, Confidence
 * AC-4.1: includes Methodology section citing Swoopy model
 * AC-4.2: shows throughput rates
 * AC-4.3: states ±40% confidence interval
 * AC-4.4: cites 1:3.5 char/token ratio
 */
export function formatSummary(result: AnalysisResult): string {
  throw new Error('Not yet implemented — RED scaffold (format.formatSummary)')
}

/**
 * Serialises an AnalysisResult as pretty-printed JSON.
 * AC-2.1: valid JSON conforming to AnalysisResult type
 */
export function formatJson(result: AnalysisResult): string {
  throw new Error('Not yet implemented — RED scaffold (format.formatJson)')
}
