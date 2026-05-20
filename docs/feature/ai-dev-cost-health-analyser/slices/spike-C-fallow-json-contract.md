# Spike C — Fallow JSON Contract

**Goal**: Establish the actual shape of fallow's JSON output and validate
that it supports per-session delta analysis (not just whole-repo snapshots).

**Timebox**: 1 hour

---

## Hypothesis

`fallow audit --format json` (or equivalent) emits a stable JSON structure
that includes: a verdict field, dead code count, duplication count, and
complexity count — and that `--base <sha>` (or equivalent) produces a
*delta* between two commits rather than an absolute snapshot.

## What this disproves if it fails

If fallow's JSON output doesn't support per-session deltas (only whole-repo
snapshots), the health adapter design changes from "diff between two SHAs"
to "run at HEAD only, show absolute health." This weakens J-02 (detect
high-velocity sessions that degraded health) significantly.

## Method

1. Check fallow version: `npx fallow --version` (or `fallow --version`).
2. Run on Swoopy: `npx fallow audit --format json ./` — capture and inspect output.
3. Check available flags: `npx fallow audit --help` — look for `--base`, `--from`, `--since`, or similar.
4. If `--base <sha>` exists: run on two adjacent Swoopy commits and compare output.
5. Record the full JSON schema (top-level keys, nested structures, types).
6. Map to the `HealthDelta` type:
   ```typescript
   interface HealthDelta {
     verdict: string;
     deadCodeDelta: number | null;
     duplicationDelta: number | null;
     complexityDelta: number | null;
   }
   ```

## Questions to answer

- Q1: Does fallow have a `--format json` flag? If not, what JSON output path exists?
- Q2: Is there a `--base <sha>` or diff mode? Or does it only produce snapshots?
- Q3: What does `verdict` look like? A string enum? A severity level?
- Q4: Are dead code, duplication, and complexity counts distinct fields, or
  aggregated into a single score?
- Q5: Does fallow require being run from the repo root? Or can a path be passed?
- Q6: Is fallow installed globally, or only via `npx`? How should the adapter
  detect it?

## Pass criteria

- [ ] fallow is installable and runs on Swoopy without errors
- [ ] JSON output is stable (same command = same output for same snapshot)
- [ ] Output contains at minimum a health verdict and at least one quantitative metric
- [ ] A delta or comparison mode exists (even if the mechanism differs from `--base`)

## Fail criteria and design consequences

| Failure | Consequence |
|---------|-------------|
| fallow not available / install fails | Health adapter is a pure stub for now; revisit if fallow gains stability |
| No JSON output mode | Parse text output or abandon fallow in favour of a different health tool |
| No delta/diff mode — snapshots only | Health adapter runs at session end SHA and HEAD; returns absolute metrics, not deltas; rename `HealthDelta` → `HealthSnapshot` |
| Schema differs from HealthDelta shape | Adjust `HealthDelta` type to match actual schema; don't force it |
| fallow requires paid features for meaningful output | Document limitation; free tier metrics only |

## Artefacts

- `spikes/spike-c-results.md` — actual JSON output sample, flag inventory, answers to Q1–Q6
- Raw JSON output sample pasted into results file (redact any file paths if needed)
