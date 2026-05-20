# ADR-05: Single package over @cca/core + @cca/cli split

**Status**: Accepted | **Date**: 2026-05-20

## Context

The walking skeleton is a single `packages/cli` package. The DESIGN wave evaluated splitting into:
- `@cca/core` — pure domain functions + port types
- `@cca/cli` — shell adapters + commander

This would create a formal package boundary enforced by pnpm workspace + tsconfig project references.

## Decision

Remain a single package (`packages/cli`). Enforce the core/shell boundary via dep-cruiser (ADR-02), not package separation.

## Rationale

- **YAGNI**: there is no second consumer of `@cca/core` in near-term scope. A VSCode extension or web API are hypothetical.
- **dep-cruiser is sufficient**: the boundary between core and shell is enforced as a build gate. Package separation adds ceremony without adding correctness.
- **Monorepo overhead**: tsconfig project references, inter-package workspace deps, and `tsc --build` sequencing add friction for no current benefit.
- **Reversible**: if a second consumer materialises, extracting `@cca/core` as a separate package is a mechanical refactor — the dep-cruiser boundary means core already has no shell imports.

## Constraints

- The dep-cruiser config MUST be in place before DELIVER begins; the boundary cannot remain convention-only.
- If a VSCode extension or web consumer is scoped, revisit this decision before DELIVER of that feature.

## Alternatives Rejected

- **@cca/core + @cca/cli**: Correct long-term but premature now. Over-engineers for a solo developer tool with one entry point.
