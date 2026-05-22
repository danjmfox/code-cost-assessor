# Slice 02 — CLI --estimator Flag

**Goal**: Add `--estimator <path>` to `cca analyse`. Dynamically import the module,
validate the export, and surface the custom methodology note in output.

## IN Scope

- `--estimator <path>` option in `index.ts`
- Dynamic ESM import of the module at `path`
- Validation: exits 1 with descriptive error if default export is missing or malformed
- Pass the loaded estimator to `analyse()` via `ports.estimator`
- Integration test: fixture estimator file (`test/fixtures/stub-estimator.ts`) → assert custom `note` in formatted output (summary + JSON)
- README section: `Estimator` port type, `--estimator` flag, example custom module

## OUT Scope

- Config-file-based estimator selection
- Named built-in estimator presets
- Validation of returned `EffortEstimate` values (negative hours, NaN)

## Learning Hypothesis

Disproves: Node ESM dynamic import of a user-provided `.ts` file (under
`--experimental-strip-types`) is unreliable in this runtime environment.
Confirms: a developer can write a 10-line module, point `--estimator` at it,
and see their custom `note` in the output — end-to-end in one command.

## Acceptance Criteria

- AC-2.1 through AC-2.5 (see feature-delta.md)
- Error message for malformed export is descriptive (names the expected shape)
- `cca analyse <repo>` with no flag: byte-identical to slice 1 output

## Dependencies

- Slice 01 completed ✓ (port + default adapter in place)

## Effort Estimate: ≤ 4 hours

Reference class: dynamic import + CLI flag wiring — low uncertainty, minor
runtime compatibility check needed for strip-types + dynamic import interaction.

## Pre-slice Spike

None. Node 22 ESM dynamic import is stable. The `--experimental-strip-types`
interaction is worth a 30-minute local probe before coding, not a formal spike.
