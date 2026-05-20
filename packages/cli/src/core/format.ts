import type { AnalysisResult, Session } from './types.ts'

const SEPARATOR_WIDTH = 62
const HEADER_SEPARATOR = '═'.repeat(SEPARATOR_WIDTH)
const ROW_SEPARATOR = '─'.repeat(SEPARATOR_WIDTH)

function formatSessionDate(session: Session): string {
  return session.startTime.slice(0, 10)
}

function formatSessionRow(session: Session): string {
  const index = String(session.sessionIndex).padStart(7)
  const date = formatSessionDate(session).padEnd(10)
  const commits = String(session.commits.length).padStart(7)
  const hours = session.effortEstimate.hours.toFixed(0).padStart(10)
  const confidence = session.effortEstimate.confidence
  return `${index}  ${date}  ${commits}  ${hours}  ${confidence}`
}

function formatHeader(result: AnalysisResult): string[] {
  return [
    'Code Cost Assessor — Session Analysis',
    HEADER_SEPARATOR,
    `Repository: ${result.repoPath}`,
    `Analysed:   ${result.analysedAt.slice(0, 10)}`,
    `Commits:    ${result.totals.commits} (non-merge, grouped into ${result.totals.sessions} sessions)`,
    '',
  ]
}

function formatTableHeader(): string[] {
  return [
    'Session  Date        Commits  Est. Hours  Confidence',
    ROW_SEPARATOR,
  ]
}

function formatTotalsRow(result: AnalysisResult): string {
  const commits = String(result.totals.commits).padStart(7)
  const hours = result.totals.hours.toFixed(0).padStart(10)
  return `${'TOTAL'.padStart(7)}  ${''.padEnd(10)}  ${commits}  ${hours}h ±40%`
}

function formatMethodologySection(): string[] {
  return [
    '',
    'Methodology: Swoopy token-weighted model',
    '  Throughput: source 250, test 400, doc 500, config 600 tokens/day',
    '  Char/token ratio: 1:3.5 | Confidence interval: ±40%',
    '  Health analysis: unavailable (fallow not configured)',
    '',
  ]
}

export function formatSummary(result: AnalysisResult): string {
  const lines: string[] = [
    ...formatHeader(result),
    ...formatTableHeader(),
    ...result.sessions.map(formatSessionRow),
    ROW_SEPARATOR,
    formatTotalsRow(result),
    ...formatMethodologySection(),
  ]
  return lines.join('\n')
}

export function formatJson(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2)
}
