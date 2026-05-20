/**
 * Unit tests for core/classify-file.ts
 * All tests are .skip until DELIVER implements the module.
 */
import { describe, it, expect } from 'vitest'
import { classifyFile, DEFAULT_EXCLUDE_PATTERNS } from '../../../src/core/classify-file.ts'

describe('classifyFile', () => {
  describe('exclusions (returns null)', () => {
    it.skip('excludes pnpm-lock.yaml', () => {
      expect(classifyFile('pnpm-lock.yaml', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
    })

    it.skip('excludes yarn.lock', () => {
      expect(classifyFile('yarn.lock', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
    })

    it.skip('excludes files in dist/', () => {
      expect(classifyFile('dist/index.js', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
    })

    it.skip('excludes files in graphify-out/', () => {
      expect(classifyFile('graphify-out/data.json', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
    })

    it.skip('excludes binary image files', () => {
      expect(classifyFile('docs/screenshot.png', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
      expect(classifyFile('assets/icon.svg', DEFAULT_EXCLUDE_PATTERNS)).toBeNull()
    })
  })

  describe('classification', () => {
    it.skip('classifies .test.ts files as test', () => {
      expect(classifyFile('src/core/detect-sessions.test.ts')).toBe('test')
      expect(classifyFile('packages/cli/tests/acceptance/walking-skeleton.test.ts')).toBe('test')
    })

    it.skip('classifies .spec.ts files as test', () => {
      expect(classifyFile('src/app.spec.ts')).toBe('test')
    })

    it.skip('classifies .ts files in packages/ as source', () => {
      expect(classifyFile('packages/cli/src/core/analyse.ts')).toBe('source')
      expect(classifyFile('packages/engine/src/sim.ts')).toBe('source')
    })

    it.skip('classifies .md files as doc', () => {
      expect(classifyFile('README.md')).toBe('doc')
      expect(classifyFile('docs/HOW-IT-WAS-MADE.md')).toBe('doc')
    })

    it.skip('classifies package.json as config', () => {
      expect(classifyFile('package.json')).toBe('config')
      expect(classifyFile('packages/cli/package.json')).toBe('config')
    })

    it.skip('classifies .json files as config (excluding lock files)', () => {
      expect(classifyFile('tsconfig.json')).toBe('config')
      expect(classifyFile('.fallowrc.json')).toBe('config')
    })
  })
})
