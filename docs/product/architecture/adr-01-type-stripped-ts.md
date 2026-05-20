# ADR-01: Type-Stripped TypeScript over tsc compile step

**Status**: Accepted | **Date**: 2026-05-20

## Context

The project needs TypeScript for type safety and IDE support. Options:
1. `tsc` compile step (`.ts` → `.js`, then run `.js`)
2. `tsx` / `ts-node` (JIT transpile, adds dev dependency)
3. Node 22 `--experimental-strip-types` (runs `.ts` directly, zero overhead)

## Decision

Use Node 22's native `--experimental-strip-types`. TypeScript files run directly with `node --experimental-strip-types src/index.ts`. No build step, no output directory.

## Rationale

- Node 22.18 has stable type-stripping support (no `--experimental` breakage in practice).
- Zero CI overhead: no `tsc` compilation step, no dist/ artefacts to cache.
- Developer experience: edit → run, no watch process.
- Aligns with global CLAUDE.md "type-stripped TypeScript" default.

## Constraints

- Type-stripping only strips annotations — no `const enum`, no `namespace`, no decorator transforms.
- `tsconfig.json` still required for IDE type-checking; `tsc --noEmit` used in CI for type safety.

## Alternatives Rejected

- **tsc compile**: Adds dist/ directory, build step in CI, source map complexity. Overhead not justified for a single-user CLI tool.
- **tsx**: Adds a runtime dependency; Node 22 native support makes it redundant.
