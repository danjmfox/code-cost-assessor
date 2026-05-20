# Spike Findings — ai-dev-cost-health-analyser

Date: 2026-05-20 | All four spikes run against: `~/projects/swoopy`

---

## Spike A — Model Validation

**Hypothesis**: Swoopy throughput rates (250/400/500/600 tok/day) produce estimates
within ±40% of the HOW-IT-WAS-MADE.md total (4,725h).

**Verdict: PASS**

| Category | Estimated | Ground Truth | Ratio |
|----------|-----------|--------------|-------|
| Source   | 1,816h    | 1,484h       | 1.22× |
| Test     | 1,850h    | 1,696h       | 1.09× |
| Doc      | 1,755h    | 1,304h       | 1.35× |
| Config   |    99h    |    241h      | 0.41× |
| **Total**| **5,520h**| **4,725h**   | **1.17×** |

±40% band: 2,835h–6,615h. Result 5,520h is comfortably within range.

**Key finding 1 — exclusion list is load-bearing.**
Without excluding lock files (`pnpm-lock.yaml`, etc.) and generated assets
(`graphify-out/`), config token count inflated 20× (5,053h vs 99h). The exclusion
list mirrors the repomix exclusion list used in HOW-IT-WAS-MADE.md and is a
first-class config requirement, not an edge case.

**Key finding 2 — git diff overcounts vs final codebase snapshot.**
Source, test, and doc all run 1.1–1.4× over the repomix baseline. Expected:
git diffs capture rewrites and reverted lines that don't appear in the final
codebase. This is a known, acceptable systematic overcount — the ±40% confidence
interval absorbs it.

**Key finding 3 — config undercounts.**
After excluding lock files, the remaining config files (package.json,
tsconfig.json, etc.) produce fewer tokens than the final repomix count. Config
changes are small and mostly additive; the undercount is not a model defect.

**Design implication**: The exclusion list (`pnpm-lock.yaml`, `dist/`, `graphify-out/`,
binary assets, `.github/`) must be the default. Users should be able to extend it
via config. Without it, the model breaks.

---

## Spike B — Character Counting Performance

**Hypothesis**: Full diff character counting is fast enough at realistic scales.

**Verdict: PASS**

- Wall time: **1.85s** for 144 non-merge commits (~60 file diffs each on average)
- Git subprocess overhead dominates; Node.js string parsing is negligible
- At 2× commit count (300 commits), estimated ~3.7s — still acceptable for a CLI tool

**Design implication**: Full diff parse (Option A from D-03) is confirmed. No need
for the numstat + line-constant approximation (Option B). Accuracy beats the
marginal time saving.

---

## Spike C — Fallow JSON Contract

**Hypothesis**: fallow `audit --format json` is stable and parseable; `--base`
supports per-session delta analysis.

**Verdict: PASS** (with one architecture constraint)

fallow is accessible via `npx fallow` (no cargo required).

**Confirmed JSON structure** (`schema_version: 6`, `version: 2.76.0`):

```json
{
  "schema_version": 6,
  "verdict": "pass|warn|fail",
  "summary": {
    "dead_code_issues": 3,
    "complexity_findings": 5,
    "max_cyclomatic": 49,
    "duplication_clone_groups": 44
  },
  "attribution": {
    "gate": "new-only",
    "dead_code_introduced": 1,
    "dead_code_inherited": 2,
    "complexity_introduced": 0,
    "complexity_inherited": 5,
    "duplication_introduced": 3,
    "duplication_inherited": 41
  }
}
```

**Flag**: `--changed-since <ref>` (alias `--base`) analyzes files changed since the
given ref against the *current HEAD*. It does not accept a separate head SHA.

**Architecture constraint discovered**: For per-session health delta, the adapter
must run fallow at each session's end commit. Two options:
- Option C1: git worktree per session (parallel, complex)
- Option C2: sequential `git checkout <sha> && npx fallow audit ... && git checkout -` (simple, slow)
- Option C3: snapshot absolute counts at each session end without `--changed-since`,
  compute delta externally (no checkout needed — uses `git show <sha>:path` for each file)

Option C2 is the simplest for the skeleton; document as a known limitation.
Option C3 is the right architectural direction for the full implementation.

**Health verdict mapping** (for the session table):
- `verdict: "pass"` + no `_introduced` increments → `stable`
- Any `dead_code_introduced > 0` or `complexity_introduced > 0` → `degraded`
- `verdict: "pass"` + all `_introduced == 0` and prior session had issues → `improved`

---

## Spike D — Session Detection

**Hypothesis**: 3h gap threshold produces ~18 sessions (15–22 acceptable range)
matching Swoopy's HOW-IT-WAS-MADE.md structure.

**Verdict: PASS**

| Threshold | Sessions Detected | Target | Result |
|-----------|-------------------|--------|--------|
| 1h        | 38                | 15–22  | FAIL   |
| 2h        | 29                | 15–22  | FAIL   |
| **3h**    | **21**            | **15–22** | **PASS** |
| 4h        | 17                | 15–22  | PASS   |

Both 3h and 4h thresholds are within the acceptable range. 3h matches the
HOW-IT-WAS-MADE.md methodology more closely.

**Session structure alignment** (3h threshold):

The large HOW-IT-WAS-MADE.md sessions are correctly identified as single sessions:
- GT Session 08 (12 commits, 6h 54m) → detected S11: 12 commits, 6h 55m ✓
- GT Session 11 (19 commits, 7h 44m) → detected S14: 19 commits, 7h 45m ✓
- GT Session 12 (18 commits, 7h 11m) → detected S15: 18 commits, 7h 11m ✓

**Discrepancy**: 21 sessions detected vs GT of 18. Cause: 33 extra commits in the
window (Dependabot PRs #1–#10, CI changes) that were added to the repo after
HOW-IT-WAS-MADE.md was written. These create small "sessions" of 1–2 commits
that weren't in the original 152-commit count. Not a model defect.

**Micro-session behaviour** (GT sessions 03, 04, 05 — 5m, 7m, <1m):
These are merged into adjacent sessions by the 3h algorithm because the inter-
commit gaps were <3h even between these brief bursts and the surrounding work.
Acceptable — the algorithm surfaces the large, meaningful sessions correctly.

**Edge case**: 1-commit repo → 1 session detected, no crash. ✓

**Design implication**: 3h default is confirmed. Document that the 3h gap is
calibrated against Swoopy's commit rhythm (primarily merge-based flow); repos
with very frequent micro-commits may need a lower threshold.

---

## Cross-Cutting Findings

1. **Commit set**: Use `--no-merges` for diff analysis (avoids double-counting branch
   changes). Use all commits (including merges) for session detection (closer to
   the 152-commit ground truth).

2. **Date boundary**: `--after="<day_before_start>" --before="<day_after_end>"` is
   the reliable way to bound a commit range; git's `--after`/`--before` are
   exclusive of the specified day.

3. **fallow via npx**: No local install required. `npx --yes fallow audit` is the
   invocation. The `--yes` flag skips the install prompt in CI.

4. **Repo health baseline**: fallow reports 3 dead-code issues and 5 complexity
   findings on Swoopy's current HEAD. This is the baseline the health adapter
   would need to track from session zero.
