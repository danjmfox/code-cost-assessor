# DISCUSS Decisions — ai-dev-cost-health-analyser

## Key Decisions

- [D-01] Session is the primary unit of analysis: The spec defaulted to per-commit.
  The auditor persona and benchmark use case require session rollup. Session detection
  (time-gap grouping) is in scope for the skeleton. (see: feature-delta.md)

- [D-02] Swoopy throughput rates adopted provisionally: Rates (250/400/500/600 tok/day)
  are used as-is, pending Spike A validation. The spec's "6–10h" sanity check for Session 08
  is identified as mislabelled — it confuses AI session duration with manual effort estimate.
  (see: spike-A-model-validation.md)

- [D-03] Character counting method TBD: Full diff parse (Option A) preferred for
  reproducibility; performance validated by Spike B. (see: spike-B-git-diff-character-counting.md)

- [D-04] Fallow is optional infrastructure: Tool runs without fallow; health output is
  null with warning. Fallow JSON contract validated by Spike C. (see: spike-C-fallow-json-contract.md)

- [D-05] Session detection algorithm validated by Spike D: 3h default tested against
  Swoopy's 18-session ground truth. (see: spike-D-session-detection.md)

## Requirements Summary

- Primary job: auditor evaluates AI-built repo for cost equivalent and health trajectory
- Output: session table (summary) + RepoAnalysis JSON; both include methodology documentation
- Walking skeleton: git reading → session detection → cost estimation → CLI summary + JSON
- Feature type: infrastructure / developer tool

## Constraints Established

- Tool must function without fallow (graceful degradation is a hard requirement)
- Output must cite methodology and confidence interval (auditor defensibility)
- Session grouping threshold is configurable (not hardcoded)
- No external service integrations
- No visualisation in initial scope

## Upstream Changes

- None (greenfield; no DISCOVER or DIVERGE artifacts to reconcile)

## Spec Changes Required

- Session is the primary display unit (spec showed per-commit table)
- The "6–10h" sanity check for Session 08 is mislabelled; correct estimate is ~900–1,000h
- AC tests should compare against Swoopy session structure, not arbitrary commit examples
