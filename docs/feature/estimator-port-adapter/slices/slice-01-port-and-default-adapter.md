# Slice 01 — Port + Default Adapter

**Goal**: Define the `Estimator` port, wrap existing Swoopy logic as the default
adapter, and wire it into `analyse()`. No user-visible output change.

## IN Scope

- Export `Estimator` type from `ports.ts`
- Add `estimator: Estimator` to `Ports` type
- Create `packages/cli/src/shell/swoopy-estimator-adapter.ts` wrapping `estimateCost` + `computeHours`
- Update `analyse.ts` to call `ports.estimator.estimate(diff)` instead of importing directly
- Pass `swoopyEstimator` in `index.ts` as default
- Unit test: stub estimator called once per commit, output in session totals

## OUT Scope

- `--estimator` CLI flag (slice 2)
- Dynamic module loading
- README documentation (slice 2)

## Learning Hypothesis

Disproves: the port boundary at `(diff: string) => EffortEstimate` is too coarse
for the existing test suite or breaks the `FileStats[]`-based JSON output.
Confirms: the default adapter can wrap existing logic with no observable change,
and the port type is stable enough to build slice 2 against.

## Acceptance Criteria

- AC-1.1 through AC-1.5 (see feature-delta.md)
- `cca analyse <repo>` output byte-identical to pre-slice output (snapshot test)

## Dependencies

- `ai-dev-cost-health-analyser` delivered ✓

## Effort Estimate: ≤ 4 hours

Reference class: port extraction from existing pure function — low uncertainty.

## Pre-slice Spike

None required. `estimateCost` is a pure function; wrapping it is mechanical.
