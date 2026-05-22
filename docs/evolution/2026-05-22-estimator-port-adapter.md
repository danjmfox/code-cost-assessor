# Evolution — estimator-port-adapter

**Date**: 2026-05-22
**Waves**: DISCUSS + DESIGN + DISTILL + DELIVER
**Density**: lean (consolidated feature-delta)
**Commit**: ff84dc9

---

## Summary

Extracted effort estimation behind a driven `Estimator` port so developers can inject
a calibrated custom model at runtime — via programmatic `Ports` injection or the new
`--estimator <path>` CLI flag — without forking the tool.

The default Swoopy adapter wraps the existing `estimateCost` + `computeHours` pipeline
with zero user-visible regression. A `loadEstimator` shell module handles dynamic ESM
import and shape validation for the CLI path.

**Test coverage**: 76 tests, 0 skipped, 0 failures across 14 test files.

---

## Business Context

**Primary job (J-03)**: When the Swoopy defaults don't reflect a team's actual throughput,
plug in a custom estimator module at runtime to produce calibrated estimates without
forking the tool.

**Secondary job (J-01 inherited)**: The auditor still gets a defensible, methodology-backed
number — now from a calibrated custom model rather than generic Swoopy rates.

The `note` field in `EffortEstimate` is the honesty contract: every adapter must describe
its methodology there. Recipients of reports can reproduce the number from the note alone.

---

## Key Decisions

### D-06: Port boundary at `(diff: string) => EffortEstimate`
The port owner controls the full estimation pipeline — diff parsing, per-file classification,
cost calculation, and methodology note. Splitting at `FileStats[]` was rejected because it
leaks a Swoopy-specific intermediate type into the contract; alternative models (LOC-based,
flat-rate) may not produce per-file token counts at all.

### D-07: Default adapter wraps existing Swoopy implementation
`estimateCost` + `computeHours` become the body of `swoopyEstimator.estimate()`. Zero
regression by construction — the default path is identical to the previous implementation,
just mediated by the port interface.

### D-08: CLI `--estimator <path>` uses dynamic ESM import
Runtime plugin loading via `import(absUrl)`. Node 22 with `--experimental-strip-types`
handles `.ts` files directly — no compile step required. Explicit developer affordance,
not a security gap; documented in README.

### DDD-2: `Totals` gains `note: string`
`computeTotals` propagates `sessions[0].effortEstimate.note` to `totals.note`.
`formatSummary` reads `result.totals.note` dynamically — decouples `format.ts` from the
hardcoded Swoopy string (a pre-existing coupling smell surfaced by the port extraction).

### DDD-4: `estimator-loader.ts` isolated from `index.ts`
Dynamic import + shape validation lives in `shell/estimator-loader.ts`, keeping `index.ts`
thin. Validates `typeof export === 'object' && typeof export.estimate === 'function'`;
exits 1 with a descriptive error naming the expected shape if malformed.

---

## Slices Delivered

### Slice 01 — Port + Default Adapter
- `Estimator` type exported from `core/ports.ts`
- `estimator: Estimator` field added to `Ports`
- `swoopy-estimator-adapter.ts` created in `shell/`
- `analyse.ts` calls `ports.estimator.estimate(diff)` per commit; totals.note propagated
- `index.ts` passes `swoopyEstimator` as default
- Unit tests (AC-1.4, AC-1.5): GREEN

### Slice 02 — CLI `--estimator` Flag
- `--estimator <path>` option wired in `index.ts`
- `estimator-loader.ts` handles dynamic import + validation
- Fixture files: `stub-estimator.ts`, `malformed-estimator.ts`, `throwing-estimator.ts`
- Acceptance tests (AC-2.1 through AC-2.6): all GREEN
- README: Custom estimators section (How-To), interface reference, error table

---

## Issues Encountered

### `format.ts` hardcoded Swoopy methodology string
`formatMethodologySection()` had the Swoopy text hardcoded as multi-line display strings
rather than reading from `result.totals.note`. Discovered when AC-2.3 failed despite the
estimator being called correctly. Fixed by making `formatMethodologySection` accept `note:
string` and rendering `Methodology: ${note}`.

### `format.test.ts` fixture missing `totals.note`
The `makeResult()` test fixture predated the `note` field on `Totals`. The 3 methodology
unit tests failed after the format change because the fixture passed `undefined` for `note`.
Fixed by adding `totals.note` to the fixture with the full Swoopy methodology string.

### README merge conflict on push
Remote had added a Limitations subsection to the Methodology section during the feature
session. Resolved by keeping both: Limitations (from remote) followed by Custom estimators
(our addition).

---

## Lessons Learned

- **Port extraction surfaces coupling**: extracting a port from `analyse.ts` immediately
  revealed that `format.ts` hardcoded the methodology string. The port boundary was the
  right catalyst for that fix.

- **Totals as a derived type needs explicit design**: `Totals` had grown organically and
  was missing `note` despite the type declaration including it. The DISTILL DELIVER
  constraint on `swoopyEstimator.note` formatting (multi-line vs single-line) was the
  design decision point — resolved as single-line note in `totals.note`.

- **Lean feature-delta approach**: consolidating DISCUSS + DESIGN + DISTILL into a single
  `feature-delta.md` worked well for a 2-story, single-developer feature. No cross-wave
  navigation overhead.

---

## Permanent Artifacts

| Artifact | Location |
|----------|----------|
| ADR-06: Estimator port boundary | `docs/product/architecture/adr-06-estimator-port.md` |
| Architecture brief (updated) | `docs/product/architecture/brief.md` |
| Jobs YAML (J-03 added) | `docs/product/jobs.yaml` |
| Developer persona | `docs/product/personas/developer.yaml` |
| Implementation | `packages/cli/src/shell/swoopy-estimator-adapter.ts` |
| Implementation | `packages/cli/src/shell/estimator-loader.ts` |
| Tests | `packages/cli/tests/acceptance/estimator-port-adapter.test.ts` |
| Tests | `packages/cli/tests/unit/core/estimator-port.test.ts` |
| Fixtures | `packages/cli/tests/fixtures/` |
| Documentation | `README.md` — Custom estimators section |
