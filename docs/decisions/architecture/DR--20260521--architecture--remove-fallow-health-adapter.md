---
id: DR--20260521--architecture--remove-fallow-health-adapter
dateCreated: '2026-05-21'
version: 1.0.0
status: draft
changeType: creation
domain: architecture
slug: remove-fallow-health-adapter
changelog:
  - date: '2026-05-21'
    note: Initial creation
  - date: '2026-05-21'
    note: Marked as draft
supersedes:
  - DDD-5 (fallow health adapter stubbed to null — Slice 2)
  - ADR-04 (fallow health adapter deferred)
lastEdited: '2026-05-21'
---

# Remove fallow health adapter from scope

## 🧭 Context

The health adapter was introduced to serve J-02: "which sessions combined high velocity with health degradation, so I can focus code review." The design assumed `fallow audit --changed-since <sha>` could produce per-session health deltas by scoping analysis to each session's commit range.

Post-implementation analysis revealed a fundamental constraint: `fallow audit` always evaluates the **current working tree**. `--changed-since` scopes which files are examined, not what state the code is in. This means:

- **Option A** (run at HEAD, scope by session file set): answers "where does health debt live today?" — not J-02's question ("when was it introduced?")
- **Option B** (git checkout per session): answers J-02 correctly but requires N checkouts into a working tree cca does not own, with stash/restore complexity and no spike validation

The adapter shipped as a null stub: `HealthReader` port, `HealthDelta` type, `healthDelta: null` in `AnalysisResult` and `Session`, a passing test asserting null, and "Health analysis: unavailable" printed on every summary run. None of this serves J-02.

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
|--------|-------------|---------|-----------|
| A | Keep null stub; implement Slice 2 via Option B (checkout per session) | Rejected | Option B is invasive I/O on a repo cca doesn't own; no spike validation; high complexity for unvalidated value |
| B | Keep null stub indefinitely | Rejected | Dead infrastructure; `healthDelta: null` in every JSON output is a schema promise consumers may depend on; "unavailable" printed on every run is noise |
| C | Remove fallow entirely from the type contract and codebase | Accepted | Clean schema; no false promises; re-adding a health port later is a 30-minute job |

## 🧠 Decision

Remove fallow health analysis entirely from the codebase and type contract:

- Delete `HealthDelta` type and `healthDelta` fields from `Session` and `AnalysisResult`
- Delete `HealthReader` port and `Ports.health` from `ports.ts`
- Delete `shell/health-adapter.ts`
- Remove health port injection from `core/analyse.ts` and `index.ts`
- Remove "Health analysis: unavailable" from `formatSummary`
- Update and remove health-related acceptance tests (AC-2.5, AC-3.x)
- Update README to remove health analysis section

J-02 is deferred indefinitely until a concrete, spike-validated design exists.

## 🪶 Principles

- **Stewardship / Delete-ability**: null stubs that signal a deferred feature are anti-deletable — they accumulate as schema promises
- **Cognitive Load Tax**: every null field, every port type, every "unavailable" line taxes the reader with no payoff
- **Impeccability**: a JSON field permanently set to null is not honest output — it sets false expectations
- **YAGNI**: the port was added before Spike C validated the design; the design flaw was caught in conversation, not implementation

## 🔁 Lifecycle

Decision made in response to emerged requirements from real use (post-delivery analysis of fallow's API constraints). No implementation existed beyond a null stub.

## 🧩 Reasoning

The fundamental constraint is that fallow is HEAD-only. Option A does not serve J-02. Option B serves J-02 but requires a spike to validate feasibility and acceptable performance (N fallow invocations on a 300-commit repo = estimated 30–60s). Keeping the null stub does not preserve optionality in any meaningful way — re-adding a `HealthReader` port later is trivial. What the stub does do is pollute the JSON schema, add noise to every summary output, and imply a feature that does not exist.

Trade-off accepted: J-02 is unserved. If an auditor needs health trajectory, they should run fallow directly against the target repo.

## 🔄 Next Actions

1. Delete `HealthDelta`, `HealthReader`, `healthDelta` from types and ports
2. Delete `shell/health-adapter.ts`
3. Remove health from `analyse.ts` pipeline and `index.ts` injection
4. Remove "unavailable" from `format.ts`
5. Update acceptance tests (remove AC-2.5; remove `healthDelta` assertions from AC-2.3 and WS-5)
6. Update README
7. Commit, push

Revisit if: fallow ships `--at-sha` / snapshot mode; a concrete user need for J-02 emerges with a validated Option B design; an alternative health tool with a historical API is identified.

## 🧠 Confidence

High. The constraint (fallow is HEAD-only) is a documented CLI property, not an assumption. The cost of reversal is low (re-add port, re-add type, re-wire). The benefit of removal is immediate (cleaner schema, less noise, honest output).

## 🧾 Changelog

- 2026-05-21: Initial draft — emerged from post-delivery analysis of fallow API constraints
