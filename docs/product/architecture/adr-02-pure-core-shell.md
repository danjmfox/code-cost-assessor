# ADR-02: Pure Core / Imperative Shell with explicit port contracts

**Status**: Accepted | **Date**: 2026-05-20

## Context

The tool has clear I/O boundaries: git subprocess calls, fallow subprocess calls, filesystem reads, stdout writes. The domain logic (commit parsing, session detection, cost estimation, formatting) is a pure transformation pipeline with no I/O.

Three structural options were evaluated:
1. Single file (walking skeleton approach) — no boundary
2. Implicit core/shell split with dep-cruiser only
3. **Explicit port contracts** (function type signatures) + dep-cruiser (chosen)

## Decision

Use Pure Core / Imperative Shell where:
- `src/core/` contains only pure TypeScript functions. No `child_process`, no `fs`, no `process.env` imports.
- `src/shell/` contains I/O adapters, CLI entry, and config loading.
- Ports (`GitReader`, `HealthReader`) are TypeScript function-type interfaces defined in `src/core/ports.ts`.
- Adapters (shell-side) implement port types. Injected as parameters to the core `analyse()` orchestrator.
- dependency-cruiser config (`forbidden: core/ → shell/`) enforces the boundary mechanically.

## Rationale

- Pure functions have no hidden state; bugs have nowhere to hide; no mocks needed in unit tests.
- Port contracts mean Slice 2 (fallow health adapter) implements a known interface without touching core.
- dep-cruiser makes the boundary a build gate, not a convention. Without enforcement, the boundary erodes.
- Matches global CLAUDE.md architecture default for projects with a domain model and external services.

## Alternatives Rejected

- **Single file (walking skeleton)**: Works for the skeleton but core logic is untestable without subprocess.
- **Implicit boundary (Option 1)**: No type-level contracts; shell calls embedded in functions; harder to swap adapters for testing.
- **Two-package monorepo (Option 3)**: Stronger separation but YAGNI — no second consumer of `@cca/core` is in near-term scope (see ADR-05).
