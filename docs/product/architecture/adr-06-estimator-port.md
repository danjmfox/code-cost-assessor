# ADR-06: Pluggable Estimator Port at `(diff: string) => EffortEstimate`

**Status**: Accepted | **Date**: 2026-05-22
**Feature**: estimator-port-adapter

## Context

The current pipeline hardcodes the Swoopy token-weighted throughput model
(`estimateCost` + `computeHours`) inside `analyse.ts`. There is no mechanism
for a developer or advanced CLI user to substitute an alternative cost model
without modifying the source.

Two meaningful port boundaries were evaluated:

1. **Full estimator port**: `(diff: string) => EffortEstimate` — the implementer
   owns the complete pipeline (diff parsing + cost calculation).
2. **Cost model port only**: `(FileStats[]) => EffortEstimate` — diff parsing stays
   in core; only the pricing function is injectable.

A third option (two separate ports: parser + cost model) was considered but
rejected as YAGNI for the stated use case.

## Decision

Define `Estimator = { estimate: (diff: string) => EffortEstimate }` in
`core/ports.ts`. Add `estimator: Estimator` to `Ports`. The default adapter
(`shell/swoopy-estimator-adapter.ts`) wraps the existing `estimateCost` +
`computeHours` functions.

Additionally:
- `Totals` gains a `note: string` field propagated from the first session's
  `effortEstimate.note`. This decouples `format.ts` from hardcoded Swoopy strings.
- A dedicated `shell/estimator-loader.ts` handles dynamic import and shape
  validation for the `--estimator <path>` CLI flag.

## Rationale

**Why full pipeline over cost model only**: `FileStats.hours` is currently baked
into `estimateCost` using `THROUGHPUT_RATES`. A cost model at `(FileStats[]) =>
EffortEstimate` receives hours that are already Swoopy-computed; the custom model
can't re-derive them without a new intermediate `RawFileStats` type — a breaking
change that exceeds the scope of this feature. The full estimator port avoids this
without any type changes.

**Why `EffortEstimate.note` is the honesty contract**: the auditor persona (J-01)
needs to verify and cite the methodology. If a custom estimator silently replaces
the Swoopy calculation without updating `note`, the output misleads the auditor.
Making `note` the contract signal — and using it in `formatSummary` — ensures
custom estimators can't be invisible.

**Why `estimator-loader.ts` is separate from `index.ts`**: imperative shell
principle. `index.ts` wires CLI flags to domain calls; it should not contain
async import logic and type validation. Isolated loader is independently testable.

**Why Node ESM dynamic import**: `--experimental-strip-types` applies to all
loaded modules including dynamic imports in Node 22 — `.ts` estimator files
work without a separate compile step, matching the existing DX for the main CLI.

## Consequences

- `estimate-cost.ts` and `compute-hours.ts` become internal details of the default
  adapter. They remain in `core/` (pure functions) but are no longer called by
  `analyse.ts` directly.
- `format.ts` is decoupled from `METHODOLOGY_NOTE` — Swoopy-specific copy moves
  into `swoopy-estimator-adapter.ts`.
- Custom estimators must implement both diff parsing AND cost calculation. For
  users who only want to override rates, the README will demonstrate a thin wrapper
  that re-uses `estimateCost` and provides custom `computeHours` logic.
- dep-cruiser rules unchanged. All new imports follow existing `shell/ → core/`
  direction.

## Alternatives Rejected

**Option B — cost model port `(FileStats[]) => EffortEstimate`**: appears simpler
but is structurally broken. `FileStats.hours` is pre-computed with Swoopy rates
inside `estimateCost`. A custom `computeHours` aggregator would just re-sum the
already-wrong hours. Fixing this requires a `RawFileStats` type refactor with no
benefit over Option A.

**Two-port split (parser + cost model)**: adds `DiffParser` and `CostModel` ports,
a new `RawFileStats` intermediate type, and a full refactor of `estimate-cost.ts`.
Technically cleaner but YAGNI — no current consumer needs to swap only the parser.
