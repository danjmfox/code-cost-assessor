# SPIKE Decisions — ai-dev-cost-health-analyser

Date: 2026-05-20

---

## Assumptions Tested

Four assumptions validated from the DISCUSS open questions (OQ-1 through OQ-4):

| OQ | Assumption | Spike | Verdict |
|----|-----------|-------|---------|
| OQ-1 | Swoopy throughput rates produce estimates within ±40% of 4,725h | A | PASS (1.17×) |
| OQ-2 | Full diff character counting is fast enough at realistic scale | B | PASS (1.85s / 144 commits) |
| OQ-3 | fallow JSON schema is stable and `--base` supports per-session delta | C | PASS (schema_version 6, stable) |
| OQ-4 | 3h gap threshold produces ~18 sessions on Swoopy history | D | PASS (21 sessions, target 15–22) |

---

## Probe Verdicts

**Spike A**: WORKS — 5,520h estimated vs 4,725h ground truth (1.17×).
Source (1.22×) and test (1.09×) categories are close; overcount is systematic
and expected (git diffs capture rewrites). Exclusion list is critical.

**Spike B**: WORKS — 1.85s for 144 commits. Full diff parse is fast enough.

**Spike C**: WORKS — fallow available via `npx`, JSON schema stable at version 6.
Architecture constraint: per-session delta requires fallow to run at each
session's end commit (or equivalent snapshot approach).

**Spike D**: WORKS — 3h threshold produces 21 sessions (within 15–22 range).
Large sessions match HOW-IT-WAS-MADE.md structure precisely.

---

## Promotion Decision

**PROMOTE to Walking Skeleton**

All four assumptions validated. The core mechanism (git reading → session
detection → cost estimation → CLI output) is ready to be committed to `src/`.

Rationale: the probes confirm the ±40% confidence interval is achievable with
the Swoopy rate model, full diff character counting is feasible, session
detection is reliable, and fallow's JSON contract is stable enough to build an
adapter against.

---

## Walking Skeleton

**Driving adapter**: CLI (`packages/cli/src/index.ts`)
Command: `cca analyse <repo-path> [options]`

**Skeleton scope** (from DISCUSS Strategy B):
`git reading → session detection → cost estimation → CLI summary + JSON`

Health (Slice 2 / fallow adapter) is excluded from the skeleton.

**Acceptance test path**:
`tests/acceptance/ai-dev-cost-health-analyser/walking-skeleton.feature`

**Demo command**:
`cca analyse ~/projects/swoopy` → session table with estimated hours

**Promotion recorded**: 2026-05-20 — user selected PROMOTE after reviewing all
four spike results.

**Commit**: to be added after walking skeleton is built and the acceptance
test is green.

---

## Design Implications for DESIGN Wave

From spike learnings — DESIGN must account for:

1. **Exclusion list as first-class config**: `pnpm-lock.yaml`, `dist/`, `graphify-out/`,
   binary assets, `.github/` must be excluded by default. Configurable via `.ccarc.json`
   or CLI flag `--ignore <pattern>`. Without this, the model produces numbers 2×
   over ground truth.

2. **Commit set strategy**: Two strategies needed —
   - Diff analysis: `--no-merges` flag (counts each change once)
   - Session detection: all commits including merges (closer to human-visible commit count)
   These are separate git log invocations with different flags.

3. **fallow adapter architecture**: Health overlay requires running fallow at each
   session's end commit. Recommended approach for initial implementation: sequential
   checkout + audit. Documented as slow for large repos; worktree approach is
   the upgrade path. The adapter must accept null from fallow when it's absent
   (per D-04 hard requirement).

4. **config under-counts are not a defect**: Config category (scripts, package.json)
   systematically undercounts because lock files are excluded. This is correct
   behaviour — the ±40% confidence interval covers the resulting variance.

5. **Session count drift**: Any repo with CI/Dependabot commits will produce more
   sessions than a human-curated count suggests. The session count should be
   reported as-measured; no attempt to filter "non-human" sessions.

---

## Constraints Discovered

- `npx fallow` (not `cargo install fallow-cli`) is the reliable install path on
  Node-based developer machines without Rust toolchain.
- `fallow audit --changed-since` does not accept a separate head SHA; fallow
  analyzes current HEAD. The adapter must ensure it runs at the correct commit.
- Lock file exclusion is non-negotiable for model correctness. Implement as an
  opt-out list, not an opt-in.
- 3h session gap is calibrated to merge-based workflows. Repos with continuous
  integration (commits every few minutes across hours) may produce different results.
