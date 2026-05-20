# DESIGN Decisions — ai-dev-cost-health-analyser

Date: 2026-05-20

---

## Key Decisions

- [DDD-1] **Single package with explicit port contracts**: Ports are TypeScript function type signatures; DI via parameter passing; dep-cruiser enforces boundary. (see: ADR-02)
- [DDD-2] **execSync over simple-git**: No dependency cost; spike validated 1.85s/144 commits. (see: ADR-03)
- [DDD-3] **Exclusion list in .ccarc.json**: Spike A confirmed load-bearing; users must extend for project-specific generated paths. (see: ADR-02, spike findings)
- [DDD-4] **Dual git log strategy**: `--no-merges` for cost analysis; all commits for session detection. (see: spike findings, cross-cutting)
- [DDD-5] **Health adapter null stub**: D-04 hard requirement; HealthReader port defined and injectable, returning null until Slice 2. (see: ADR-04)
- [DDD-6] **FP paradigm + Pure Core / Shell**: Pure functions in `core/`, I/O in `shell/`. (see: ADR-02, global CLAUDE.md)

---

## Architecture Summary

- **Pattern**: Pure Core / Imperative Shell (hexagonal via functions)
- **Paradigm**: Functional
- **Packages**: Single (`packages/cli`)
- **Key components**: `core/` (pure pipeline), `shell/` (git adapter, health adapter, config loader, CLI entry)
- **Boundary enforcement**: dependency-cruiser (forbidden: `core/` → `shell/`)

---

## Reuse Analysis

| Existing Component | File | Overlap | Decision | Justification |
|---|---|---|---|---|
| `analyse()` function | `packages/cli/src/analyse.ts` | All current cost analysis logic | EXTEND | Refactor into core/shell; no rewrite |
| CLI entry | `packages/cli/src/index.ts` | Commander setup | EXTEND | Add config-loader + port injection |
| Acceptance test | `packages/cli/tests/acceptance/walking-skeleton.test.ts` | AC-1.1–2.1 | EXTEND | Add scenarios as ACs expand |

---

## Technology Stack

- Runtime: Node 22.18, ESM
- Language: TypeScript (type-stripped, `--experimental-strip-types`)
- CLI: commander v12
- Git access: `child_process.execSync` (stdlib)
- Health: `npx fallow` ≥2.76 (Slice 2)
- Testing: Vitest v3
- Boundary: dependency-cruiser v16
- Config: `.ccarc.json`

---

## Constraints Established

- `core/` MUST NOT import from `shell/` — dep-cruiser gates this in CI
- Exclusion list (pnpm-lock.yaml, dist/, graphify-out/, binary assets, .github/) MUST be the default
- `HealthReader.getDelta()` MUST return `null` (not throw) when fallow is absent
- Initial commit (no parent) MUST be handled gracefully by git adapter (return empty diff string)
- `--experimental-strip-types` requires Node 22.6+; document minimum version

---

## Upstream Changes (vs DISCUSS)

None. All DISCUSS decisions (D-01 through D-05) are compatible with the chosen architecture. Spike constraints have been incorporated as DDD decisions without invalidating any user story or acceptance criterion.

---

## Open Questions (to DISTILL)

| OQ | Question |
|----|---------|
| OQ-1 | Glob patterns in exclusion list? |
| OQ-2 | `--dev-rate` output format (hourly rate → USD) |
| OQ-3 | Session gap guidance for CI repos |
| OQ-4 | Include exclusion list used in JSON output for reproducibility? |
