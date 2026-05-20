# DISTILL Decisions — ai-dev-cost-health-analyser

Date: 2026-05-20

---

## Key Decisions

- [DWD-1] **WS Strategy C (Real local)**: all adapters use real I/O; no doubles. All local resources (git, filesystem). Health returns null (documented behavior, not a double).
- [DWD-2] **Walking skeleton inherited from SPIKE**: not rewritten. 6 scenarios green. DISTILL adds 10 non-skip acceptance tests and 17 skip unit tests on top.
- [DWD-3] **JSON shape tests use `.skip` until DELIVER**: AC-2.2, AC-2.3, AC-2.4, AC-2.6 require new `AnalysisResult` type shape not yet in `analyse.ts`. DELIVER implements core/analyse.ts and removes `.skip`.
- [DWD-4] **Unit tests all use `.skip`**: pure function tests import from scaffold modules that throw. Pre-commit gate (lefthook) requires no failing tests. DELIVER un-skips one test per TDD cycle.
- [DWD-5] **Scaffold modules throw, not return defaults**: all scaffold functions throw `Error("Not yet implemented — RED scaffold")`. Tests are `.skip` so no pre-commit failure.

---

## Scenario Summary

| Status | Count | Notes |
|--------|-------|-------|
| GREEN (acceptance) | 16 | Immediately passing; regression guards during DELIVER |
| SKIP (acceptance) | 4 | AC-2.2, AC-2.3, AC-2.4, AC-2.6 — new JSON shape |
| SKIP (unit) | 33 | Core pure functions — all un-skipped in DELIVER TDD cycles |
| **Total** | **53** | — |

---

## Adapter Coverage

All three driven adapters (GitReader, HealthReader, ConfigLoader) have at least one `@real-io` scenario.

---

## Open Questions Resolved

| OQ | Resolution |
|----|-----------|
| OQ-1 (glob in exclusion list) | RegExp patterns already in `classify-file.ts`; `.ccarc.json` support for strings is a DELIVER scope item |
| OQ-2 (`--dev-rate` format) | Deferred — not in Slice 1 AC scope |
| OQ-3 (CI repo session gap) | README note in DELIVER documentation step |
| OQ-4 (exclusion list in JSON) | DELIVER decides: either in `analysedAt` extended config snapshot or separate `excludePatterns` field |

---

## Upstream Issues

None. All DISCUSS and DESIGN decisions are reflected in the scenario set without contradiction.

---

## Self-Review Checklist

- [x] WS strategy declared (DWD-1)
- [x] WS scenarios tagged `@real-io` (Strategy C)
- [x] Every driven adapter has at least one `@real-io` scenario
- [x] Scaffold modules created with `__SCAFFOLD__` marker
- [x] Tests are `.skip` (no pre-commit failures)
- [x] Driving adapter exercised via subprocess in all acceptance tests
- [x] 16/53 tests passing (no regressions)

---

## DELIVER Handoff

DELIVER reads this file + `feature-delta.md` DISTILL sections + test files.

**TDD cycle order (suggested for DELIVER):**
1. `core/types.ts` — type definitions (no implementation; already created)
2. `core/ports.ts` — port types (already created)
3. `core/classify-file.ts` — un-skip U-8 to U-11 → implement → green
4. `core/estimate-cost.ts` — un-skip U-12, U-13 → implement → green
5. `core/compute-hours.ts` — un-skip U-14 to U-17 → implement → green
6. `core/parse-commits.ts` — un-skip U-1 to U-4 → implement → green
7. `core/detect-sessions.ts` — un-skip U-5 to U-7 → implement → green
8. `core/format.ts` — implement formatSummary + formatJson
9. `shell/git-adapter.ts` — implement createGitAdapter
10. `shell/health-adapter.ts` — already implemented (returns null)
11. `shell/config-loader.ts` — implement loadConfig
12. `core/analyse.ts` — un-skip WS scaffold; wire pipeline; un-skip S2-1, S2-2, S2-3
13. Refactor `index.ts` to use new modules + ports
14. Un-skip S2-5 (--output flag) → implement → green
15. Add dep-cruiser config; run `pnpm dep-cruiser`
16. Remove monolithic `analyse.ts` (skeleton); verify all tests still green
17. `grep -r "__SCAFFOLD__" packages/cli/src/` → zero results
