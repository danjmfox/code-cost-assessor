# Evolution Record — ai-dev-cost-health-analyser

Archived: 2026-05-20 | Waves: DISCUSS → SPIKE → DESIGN → DISTILL → DELIVER

---

## What shipped

Slice 1 of the Code Cost Assessor CLI: a git-history cost estimator using the Swoopy token-weighted model. Estimates manual development effort from commit diffs grouped into sessions. Outputs a session table (summary) or full AnalysisResult JSON (for benchmarking).

68/68 tests passing. All DISCUSS acceptance criteria satisfied except AC-3.x (health trajectory — deferred to Slice 2).

---

## Key decisions and their outcomes

| Decision | Outcome |
|----------|---------|
| Pure Core / Shell architecture (DDD-6) | Clean boundary enforced by dep-cruiser; 0 violations at ship |
| execSync over simple-git (DDD-2, ADR-03) | Spike validated: 1.85s/144 commits, no dependency added |
| Exclusion list first-class (DDD-3) | Without it, config category inflated ~20×; DEFAULT_EXCLUDE_PATTERNS prevents this |
| Walking skeleton inherited from SPIKE | Saved 1 DISTILL iteration; 6 tests inherited green |
| DISTILL scaffold + .skip discipline | All 53 tests written before implementation; 0 pre-commit failures |
| fallow adapter null stub (ADR-04) | Health unavailable cleanly; Slice 2 unblocked |

---

## What was NOT built (by design)

- Health trajectory overlay (Slice 2 — fallow integration)
- `--dev-rate` USD cost conversion (AC-4.5 — deferred)
- HTML/chart output (out of scope)
- Historical trend comparison (requires external tooling)

---

## Technical debt and carry-forward

- `src/index.ts` contains `formatCompatibleJson` — a backward-compatibility shim merging old walking-skeleton JSON fields with the new AnalysisResult shape. Remove when acceptance tests are updated to use only the new shape.
- `--session-gap` is parsed as hours in index.ts but passed as `sessionGapHours` to loadConfig. The config schema and CLI option naming could be unified.
- No CI pipeline wired yet. dep-cruiser is run manually (`pnpm dep-cruiser`).

---

## Surprising findings

- Root commit edge case: `git diff <sha>~1 <sha>` fails for repos with a single commit. The git adapter silently returns '' — this is correct but was discovered only when running against a fresh test repo, not Swoopy.
- The walking skeleton acceptance tests were written against a `{ sessions: [...], totalHours: N }` shape. The new AnalysisResult shape uses `{ sessions: [...], totals: { hours: N } }`. The backward-compat shim in index.ts bridges this without rewriting the tests.

---

## Commits (DELIVER wave)

```
1edb4ee docs: add README with methodology and output format
0bdf0a6 chore: remove stale __SCAFFOLD__ from health-adapter
7d298ef refactor: remove monolithic analyse.ts
82bc371 chore: add dependency-cruiser config
340abc2 feat: un-skip AC-2.6 --output flag test
69c27a3 feat: wire analyse pipeline and inject ports in index
4538e6c feat: implement loadConfig shell adapter
0da82d5 feat: implement createGitAdapter shell adapter
46fba03 feat: implement formatSummary and formatJson pure functions
b6c985a feat: implement detectSessions pure function
d59b71c feat: implement parseCommits pure function
045831f feat: implement computeHours pure function
06f87bc feat: implement estimateCost pure function
1d7b2c4 feat: implement classifyFile pure function
```
