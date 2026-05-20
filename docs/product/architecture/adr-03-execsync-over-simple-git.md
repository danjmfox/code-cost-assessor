# ADR-03: child_process.execSync over simple-git

**Status**: Accepted | **Date**: 2026-05-20

## Context

Git operations (log, diff) can be performed via:
1. `simple-git` npm package (high-level async API)
2. `child_process.execSync` (raw git commands, sync)
3. `child_process.exec` (raw git commands, async)

DISCUSS specified `simple-git` as the planned dependency. Spike B validated the raw execSync approach.

## Decision

Use `child_process.execSync` (Node stdlib) for all git operations in the git adapter.

## Rationale

- **Spike B validated it**: 1.85s for 144 commits with 60-file diffs average. The performance budget is met.
- **Zero dependency**: no npm package to version, audit, or keep updated.
- **Transparent**: git commands are visible in the adapter; debugging is a matter of running the command in a terminal.
- **Buffer limit**: 64MB buffer covers realistic repos (Swoopy: ~2MB total diffs). Configurable if needed.
- **Sync is appropriate**: the tool is a CLI (not a server); blocking I/O is acceptable and avoids async complexity.

## Constraints

- The git adapter is responsible for handling the initial-commit edge case (no parent → empty diff string).
- `maxBuffer` must be set (default 1MB is too small for large repos).

## Alternatives Rejected

- **simple-git**: Adds a dependency for functionality already in stdlib. Would have been right if we needed async git operations or a richer API, but the spike showed raw commands are fast and sufficient.
- **exec (async)**: Adds Promise complexity without benefit for a synchronous CLI pipeline.
