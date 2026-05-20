# Spike A — Model Validation

**Goal**: Validate that the Swoopy token-weighted throughput model produces
plausible per-session estimates when applied to real git history.

**Timebox**: 2 hours

---

## Hypothesis

Applying the Swoopy throughput rates (250/400/500/600 tokens/day) to
character counts extracted from git diffs will produce session estimates
that, when summed, land within ±40% of the HOW-IT-WAS-MADE.md total
(4,725 hours for the full Swoopy repo).

## What this disproves if it fails

If the sum of per-session estimates deviates by more than 2× from the
HOW-IT-WAS-MADE.md total, the throughput rates or the character counting
method is wrong, and the spec's cost model cannot be used as-is.

## Known prior inconsistency

The spec's sanity check claims Session 08 (+3,687 insertions, 50/50
source/test) → "6–10 hours." Back-calculation shows this is impossible
with the stated rates:

```
Source tokens ≈ 1,844 lines × 35 chars/line ÷ 3.5 = 18,440 tokens
Source hours  = (18,440 / 250) × 8 = 590 hours
Test hours    = (18,440 / 400) × 8 = 369 hours
Total         ≈ 959 hours
```

6–10 hours is the actual AI session duration (6h 54m), not the manual
effort estimate. The spike either confirms ~950 hours is correct (and the
sanity check in the spec was mislabelled), or reveals the model needs
recalibration.

## Method

1. Write a standalone script (`spikes/spike-a.ts`) with no framework dependencies.
2. Implement the pure estimation function:
   ```
   tokens = insertionChars / 3.5
   hours  = (tokens / throughputRate) × 8
   ```
3. Run against Swoopy's git history using `simple-git`:
   - Walk all 152 commits
   - For each commit: get the full diff, count `+` line characters per file
   - Classify each file (source / test / doc / config / asset)
   - Compute hours per file, sum per session (3h gap)
4. Compare output to HOW-IT-WAS-MADE.md:
   - Total hours: should be 4,200–5,200 (4,725 ± 40%)
   - Session 08: record actual estimate (expected: ~900–1,000h, NOT 6–10h)
   - Session structure: should produce ~18 sessions on the 14-day repo

## Pass criteria

- [ ] Total estimated hours within ±40% of 4,725 (2,835–6,615h)
- [ ] Per-session estimates are monotonic with session size (bigger sessions = more hours)
- [ ] Session 08 estimate is plausible relative to its share of total insertions (~22%)
- [ ] The model produces different estimates for different file-category mixes (categories are load-bearing)

## Fail criteria and design consequences

| Failure | Consequence |
|---------|-------------|
| Total < 2,000h or > 10,000h | Throughput rates or char/token ratio need recalibration; D-02 reopens |
| All sessions produce nearly identical hours regardless of insertions | Character counting or categorisation is broken |
| Session 08 = 6–10h | Character-to-line approximation is using wrong unit (lines as chars directly) — fix the bug |
| Suspiciously round numbers | Floating point truncation in the formula; check integer division |

## Artefacts

- `spikes/spike-a.ts` — throwaway script, deleted after spike completes
- `spikes/spike-a-results.md` — findings (kept; feeds D-02 and D-03)

## Promotion path

If PASS: adopt the formula and rates as-is. Document the "6–10h" sanity
check as mislabelled (AI session duration ≠ manual effort estimate). Update
spec accordingly.

If FAIL: run recalibration experiment — try rates 10× higher (2,500/4,000/
5,000/6,000 tok/day) and re-check against HOW-IT-WAS-MADE.md total.
