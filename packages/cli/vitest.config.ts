import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    // Unit tests for scaffold modules are all .skip — safe to include.
    // Remove .skip one at a time in DELIVER TDD cycles.
  },
})
