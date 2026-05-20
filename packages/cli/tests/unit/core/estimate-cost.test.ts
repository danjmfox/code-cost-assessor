/**
 * Unit tests for core/estimate-cost.ts
 * All tests are .skip until DELIVER implements the module.
 */
import { describe, it, expect } from 'vitest'
import { estimateCost } from '../../../src/core/estimate-cost.ts'
import { DEFAULT_EXCLUDE_PATTERNS } from '../../../src/core/classify-file.ts'

const SAMPLE_DIFF = `
diff --git a/packages/cli/src/core/detect-sessions.ts b/packages/cli/src/core/detect-sessions.ts
new file mode 100644
--- /dev/null
+++ b/packages/cli/src/core/detect-sessions.ts
@@ -0,0 +1,3 @@
+export function detectSessions() {
+  return []
+}
diff --git a/packages/cli/tests/unit/core/detect-sessions.test.ts b/packages/cli/tests/unit/core/detect-sessions.test.ts
new file mode 100644
--- /dev/null
+++ b/packages/cli/tests/unit/core/detect-sessions.test.ts
@@ -0,0 +1,2 @@
+import { detectSessions } from '../detect-sessions.ts'
+// tests here
`.trim()

describe('estimateCost', () => {
  it.skip('returns one FileStats entry per changed file', () => {
    const stats = estimateCost(SAMPLE_DIFF, DEFAULT_EXCLUDE_PATTERNS)
    expect(stats).toHaveLength(2)
  })

  it.skip('counts characters in added (+) lines only, not headers', () => {
    const singleFileDiff = `
diff --git a/src/foo.ts b/src/foo.ts
--- /dev/null
+++ b/src/foo.ts
@@ -0,0 +1,1 @@
+hello`.trim()
    const stats = estimateCost(singleFileDiff, DEFAULT_EXCLUDE_PATTERNS)
    expect(stats[0].charCount).toBe(5)  // 'hello' = 5 chars
  })

  it.skip('classifies .ts files in packages/ as source', () => {
    const stats = estimateCost(SAMPLE_DIFF, DEFAULT_EXCLUDE_PATTERNS)
    const src = stats.find(s => s.path.includes('detect-sessions.ts') && !s.path.includes('test'))
    expect(src?.category).toBe('source')
  })

  it.skip('classifies .test.ts files as test', () => {
    const stats = estimateCost(SAMPLE_DIFF, DEFAULT_EXCLUDE_PATTERNS)
    const test = stats.find(s => s.path.includes('.test.ts'))
    expect(test?.category).toBe('test')
  })

  it.skip('excludes pnpm-lock.yaml from results', () => {
    const lockDiff = `
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1,1 +1,1 @@
+lockfileVersion: '9.0'`.trim()
    const stats = estimateCost(lockDiff, DEFAULT_EXCLUDE_PATTERNS)
    expect(stats).toHaveLength(0)
  })

  it.skip('returns empty array for empty diff', () => {
    expect(estimateCost('', DEFAULT_EXCLUDE_PATTERNS)).toHaveLength(0)
  })
})
