# Spike D — Session Detection

**Goal**: Validate that time-gap session detection (default: 3h) produces
sessions that match human-perceived work blocks on Swoopy's git history.

**Timebox**: 1 hour

---

## Hypothesis

Grouping Swoopy's 152 commits into sessions using a 3-hour inter-commit gap
threshold will produce approximately 18 sessions matching the structure
described in HOW-IT-WAS-MADE.md — with session durations, commit counts,
and dates that align within reasonable tolerance.

## What this disproves if it fails

If the algorithm produces 40 sessions or 8 sessions, the 3h default is wrong
for this kind of repo (frequent micro-commits or long gaps within sessions).
This would require either a different default, a calibration heuristic, or
accepting that session count is repo-dependent (configurable, not guessable).

## Method

1. Write `spikes/spike-d.ts` using `simple-git`.
2. Load all 152 Swoopy commits with timestamps (`git log --format=%H %at %s`).
3. Sort by timestamp.
4. Apply time-gap grouping: start a new session when gap > 3h.
5. For each detected session:
   - Start timestamp, end timestamp
   - Duration (endTime - startTime)
   - Number of commits
6. Compare to HOW-IT-WAS-MADE.md session log (18 sessions over 14 days):
   - Do session counts match approximately?
   - Do durations match? (e.g. Session 08 = 6h 54m → detected as one session?)
   - Are the micro-sessions (Session 03: 5m, Session 05: <1m) correctly isolated?

## Known ground truth from HOW-IT-WAS-MADE.md

| Session | Duration | Commits |
|---------|----------|---------|
| 01 | 4h 19m | 11 |
| 02 | 4h 40m | 9 |
| 03 | 5m | 2 |
| 04 | 7m | 4 |
| 05 | <1m | 2 |
| 06 | 4h 45m | 9 |
| 07 | 41m | 7 |
| 08 | 6h 54m | 12 |
| 09 | 1h 27m | 8 |
| 10 | 5h 54m | 19 |
| 11 | 7h 44m | 19 |
| 12 | 7h 11m | 18 |
| 13 | <1m | 1 |
| 14 | 2h 21m | 8 |
| 15 | 1h 48m | 4 |
| 16 | 5h 47m | 15 |
| 17 | 55m | 2 |
| 18 | 13m | 2 |

Sessions 03, 04, 05 are within a 4-hour window on the same day. A 3h gap
threshold may merge them or split them depending on actual commit timestamps.

## Questions to answer

- Q1: Does 3h produce ~18 sessions, or does it merge/split the micro-sessions?
- Q2: What threshold produces the best match? (Try 1h, 2h, 3h, 4h.)
- Q3: Are sessions 03/04/05 (short consecutive sessions) distinguishable at any threshold?
- Q4: What is the commit timestamp resolution in Swoopy? (Seconds? Do squashed
  commits lose intra-session timing?)

## Pass criteria

- [ ] 3h threshold produces 15–22 sessions (within 20% of 18)
- [ ] Large sessions (08, 10, 11, 12) are each detected as single sessions
- [ ] Micro-sessions (03, 05, 13) are either isolated or merged with an adjacent session
  (documented, not a failure)
- [ ] Algorithm handles repos with only 1 commit without crashing

## Fail criteria and design consequences

| Failure | Consequence |
|---------|-------------|
| 3h produces < 10 or > 30 sessions | Default threshold needs changing OR threshold should be calibrated per-repo |
| Sessions 08/11 split into multiple sessions | Gap detection bug — check timestamp arithmetic |
| No threshold produces reasonable sessions | Session detection is fundamentally unreliable for this repo; fall back to calendar-day grouping |
| All commits have same timestamp (squash artifacts) | Session detection is not viable; per-commit output only |

## Artefacts

- `spikes/spike-d.ts` — throwaway script
- `spikes/spike-d-results.md` — detected sessions table, comparison to HOW-IT-WAS-MADE.md, recommended default threshold
