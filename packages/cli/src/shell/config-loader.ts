import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AnalyseOptions } from '../core/types.ts'

function readRcFile(repoPath: string): Partial<AnalyseOptions> {
  const rcPath = join(repoPath, '.ccarc.json')
  if (!existsSync(rcPath)) return {}
  try {
    const raw = readFileSync(rcPath, 'utf8')
    return JSON.parse(raw) as Partial<AnalyseOptions>
  } catch {
    return {}
  }
}

export function loadConfig(
  repoPath: string,
  cliFlags: Partial<AnalyseOptions>
): AnalyseOptions {
  const fileValues = readRcFile(repoPath)
  return { ...fileValues, ...cliFlags }
}
