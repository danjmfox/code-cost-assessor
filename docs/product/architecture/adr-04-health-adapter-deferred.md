# ADR-04: fallow health adapter stubbed to null for Slice 1

**Status**: Accepted | **Date**: 2026-05-20

## Context

The tool has two independent delivery slices (from DISCUSS scope assessment):
- **Slice 1**: git reading + session detection + cost estimation + CLI output
- **Slice 2**: fallow adapter + health overlay per session

Spike C validated fallow's JSON contract (schema_version 6, stable). It also identified an architecture constraint: `fallow audit --changed-since <ref>` analyzes current HEAD vs base ref; for per-session delta, fallow must run at each session's end commit.

D-04 (from DISCUSS) is a hard requirement: "the tool MUST function without fallow."

## Decision

For Slice 1, the `HealthReader` port adapter returns `null` unconditionally and logs a stderr warning. The port contract (`getDelta() → HealthDelta | null`) is defined and injected — health is absent, not bypassed.

For Slice 2, the adapter will use Option C3 (snapshot absolute fallow counts at each session end commit, compute delta externally). This avoids git checkout for each session. Implementation deferred.

## Rationale

- Defining the port now means Slice 2 is a matter of implementing `getDelta()` in `health-adapter.ts` without touching core.
- `null` return is type-safe and forces callers to handle absence explicitly.
- Option C3 (snapshot absolute counts) avoids the checkout-per-session complexity of Option C2, while being more reliable than Option C1 (git worktree parallelism).

## Slice 2 Architecture Preview (informational)

For each session end commit, run: `git show <sha>:file` per tracked file to reconstruct the file tree, then run fallow against that reconstructed state. OR: use `git worktree add` to create a temporary worktree at the session SHA, run fallow, then remove the worktree. The worktree approach (Option C1) is cleaner but adds process management complexity — revisit in Slice 2.

## Alternatives Rejected

- **Implement health in Slice 1**: Scope overrun risk. S-3 (health overlay) is independently deliverable. Fallow's checkout-per-session constraint makes it non-trivial; rushing it risks introducing bugs in the health delta calculation.
