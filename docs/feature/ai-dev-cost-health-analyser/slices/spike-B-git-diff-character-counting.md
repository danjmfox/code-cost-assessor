# Spike B — Git Diff Character Counting

**Goal**: Validate that parsing full `git diff` output for insertion character
counts is accurate, fast enough, and correctly handles edge cases.

**Timebox**: 1.5 hours

---

## Hypothesis

Parsing the unified diff output from `git diff <prevSha> <sha>` and summing
the character lengths of `+` lines (excluding the `+` prefix) per file is:
1. Sufficiently accurate for the ±40% confidence interval of the model
2. Fast enough for a 150-commit repo in under 30 seconds
3. Correctly handles binary files, renames, mode-only changes

## What this disproves if it fails

If parsing full diffs is too slow (>2 min for Swoopy's 152 commits), the
design must fall back to numstat + an assumed chars-per-line constant, which
adds an unvalidated approximation variable and weakens reproducibility.

## Alternative under consideration (Option B)

Use `git diff --numstat` (line counts only) + a fixed `CHARS_PER_LINE`
constant (e.g. 35 for TypeScript). This avoids reading full diff content
but requires justifying the constant, which is repo- and language-dependent.

The auditor persona values reproducibility. Option A (full diff) is preferred
if performance is acceptable.

## Method

1. Write `spikes/spike-b.ts` using `simple-git`.
2. Walk Swoopy's 152 commits:
   - For each commit: time `git.diff([prevSha, sha])` (full unified diff)
   - Parse: count char lengths of lines starting with `+` (not `+++`) per file
   - Also run `git.diff(['--numstat', prevSha, sha])` for comparison
3. Measure:
   - Total wall time for all 152 commits
   - Character count vs (lines × 35) discrepancy per commit (how much does the
     constant approximation diverge from actual char counts?)
4. Test edge cases:
   - Binary file additions (should produce 0 insertion chars)
   - Renamed files (path should come from `+++ b/` header)
   - Mode-only changes (no `+` lines — should produce empty FileDiff)
   - First commit (diff against empty tree: `4b825dc642cb6eb9a060e54bf8d69288fbee4904`)

## Pass criteria

- [ ] Total wall time ≤ 30 seconds for 152 commits on Swoopy
- [ ] Edge cases (binary, rename, mode-only, first commit) handled without crash
- [ ] Character counts per file are non-zero for real code changes
- [ ] The discrepancy between full-parse chars and (lines × 35) is < 30% for
  typical TypeScript files (i.e. the constant isn't wildly wrong, but the
  actual parse is more accurate)

## Fail criteria and design consequences

| Failure | Consequence |
|---------|-------------|
| Wall time > 60s for 152 commits | Switch to numstat + constant (Option B); document accuracy trade-off |
| Binary files cause parser crash | Add binary detection guard before parsing |
| First commit diff against empty tree fails | Test the `4b825dc...` approach; fall back to `--root` flag |
| Char counts are 0 for known large commits | Parser bug — `+` line detection is wrong |

## Artefacts

- `spikes/spike-b.ts` — throwaway script
- `spikes/spike-b-results.md` — timing measurements, edge case findings, Option A vs B comparison
