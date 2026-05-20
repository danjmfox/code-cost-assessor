import { describe, expect, it } from 'vitest'
import { createGitAdapter } from '../../../src/shell/git-adapter.ts'

describe('createGitAdapter', () => {
  it('returns an object with readLog and readDiff as functions', () => {
    const adapter = createGitAdapter()
    expect(typeof adapter.readLog).toBe('function')
    expect(typeof adapter.readDiff).toBe('function')
  })

  it('readLog returns non-empty string for the assessor repo itself', () => {
    const adapter = createGitAdapter()
    const repoPath = '/Users/danielosborne/projects/code-cost-assessor'
    const result = adapter.readLog(repoPath, { noMerges: true })
    expect(result.length).toBeGreaterThan(0)
  })
})
