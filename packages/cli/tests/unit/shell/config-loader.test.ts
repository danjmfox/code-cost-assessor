import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../../../src/shell/config-loader.ts'

function withTempDir(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'cca-config-test-'))
  try {
    fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('loadConfig', () => {
  it('returns cliFlags when no .ccarc.json exists', () => {
    withTempDir((dir) => {
      const cliFlags = { sessionGapHours: 3, format: 'json' as const }
      const result = loadConfig(dir, cliFlags)
      expect(result).toEqual(cliFlags)
    })
  })

  it('cli flags override file values', () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, '.ccarc.json'), JSON.stringify({ sessionGapHours: 2 }))
      const cliFlags = { sessionGapHours: 5 }
      const result = loadConfig(dir, cliFlags)
      expect(result.sessionGapHours).toBe(5)
    })
  })

  it('file values fill in missing cli flags', () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, '.ccarc.json'), JSON.stringify({ sessionGapHours: 2 }))
      const result = loadConfig(dir, {})
      expect(result.sessionGapHours).toBe(2)
    })
  })
})
