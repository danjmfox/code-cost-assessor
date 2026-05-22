# Architecture Brief — code-cost-assessor

Last updated: 2026-05-20 | Wave: DESIGN

---

## Application Architecture

*Written by: nw-solution-architect (DESIGN wave)*

### Pattern

**Pure Core / Imperative Shell** via function-level architecture (hexagonal, no classes).

- Business logic lives in pure functions in `packages/cli/src/core/`. No I/O, no subprocess calls.
- All I/O and side effects are in `packages/cli/src/shell/`. Shell calls core; core never imports shell.
- Ports are TypeScript function type signatures (`GitReader`, `HealthReader`).
- Adapters are functions matching those type signatures, passed to the core orchestrator as parameters.
- Boundary enforced by dependency-cruiser in CI.

### Paradigm

**Functional** — pure functions, explicit data flow, pipeline composition. No classes. DI via parameter passing.

### C4 System Context

```mermaid
C4Context
    title Code Cost Assessor — System Context

    Person(auditor, "Auditor", "Evaluates AI-built repos for cost and health")

    System(cca, "cca CLI", "Estimates manual effort equivalent from git history. Outputs session table and JSON.")

    System_Ext(git, "Git Repository", "Target repo under analysis (local filesystem)")
    System_Ext(fallow, "fallow CLI", "Optional. Analyses code health per session.", "npx fallow")

    Rel(auditor, cca, "runs", "shell")
    Rel(cca, git, "reads commit log and diffs", "git subprocess")
    Rel(cca, fallow, "reads health delta (Slice 2)", "npx subprocess")
```

### C4 Container

```mermaid
C4Container
    title Code Cost Assessor — Containers

    Person(auditor, "Auditor")

    Container_Boundary(cli_pkg, "packages/cli") {
        Container(entry, "CLI Entry", "Node 22 / commander", "Parses args, loads config, injects adapters")
        Container(core, "Core Domain", "TypeScript — pure functions", "Pipeline: parse → detect → estimate → format")
        Container(git_adapter, "Git Adapter", "child_process.execSync", "Implements GitReader port")
        Container(health_adapter, "Health Adapter", "npx fallow (Slice 2)", "Implements HealthReader port — returns null")
        Container(config_loader, "Config Loader", "TypeScript", "Merges .ccarc.json + CLI flags")
    }

    System_Ext(git_repo, "Git Repository", "Local filesystem")
    System_Ext(fallow_cli, "fallow CLI", "npx")

    Rel(auditor, entry, "cca analyse <repo>", "shell")
    Rel(entry, config_loader, "resolve options")
    Rel(entry, core, "analyse(repoPath, opts, ports)")
    Rel(core, git_adapter, "ports.git.readLog / readDiff", "GitReader port")
    Rel(core, health_adapter, "ports.health.getDelta", "HealthReader port")
    Rel(git_adapter, git_repo, "git log / diff", "subprocess")
    Rel(health_adapter, fallow_cli, "npx fallow audit (Slice 2)", "subprocess")
```

### Port Contracts

```typescript
// packages/cli/src/core/ports.ts

type LogOpts = { noMerges: boolean; format?: string }

type GitReader = {
  readLog: (repoPath: string, opts: LogOpts) => string
  readDiff: (repoPath: string, sha: string) => string
}

type HealthReader = {
  getDelta: (repoPath: string, fromSha: string, toSha: string) => HealthDelta | null
}

// Pluggable estimator port (feature: estimator-port-adapter, 2026-05-22)
// The estimate() function owns the full pipeline for one commit diff.
// The note field in the returned EffortEstimate is the honesty contract:
// every implementation must describe its methodology there.
type Estimator = {
  estimate: (diff: string) => EffortEstimate
}
```

### Component Directory Layout

```
packages/cli/
├── src/
│   ├── core/                          # pure functions — no I/O
│   │   ├── ports.ts                   # GitReader, HealthReader, Estimator types
│   │   ├── types.ts                   # Commit, Session, FileStats, AnalysisResult, Totals
│   │   ├── parse-commits.ts
│   │   ├── detect-sessions.ts
│   │   ├── classify-file.ts
│   │   ├── estimate-cost.ts           # used internally by swoopy-estimator-adapter
│   │   ├── compute-hours.ts           # used internally by swoopy-estimator-adapter
│   │   ├── format.ts
│   │   └── analyse.ts                 # pipeline orchestrator (accepts ports)
│   └── shell/                         # I/O and adapters
│       ├── git-adapter.ts             # implements GitReader
│       ├── health-adapter.ts          # implements HealthReader (null stub)
│       ├── swoopy-estimator-adapter.ts # implements Estimator (default Swoopy model)
│       ├── estimator-loader.ts        # dynamic import + validation for --estimator flag
│       ├── config-loader.ts           # .ccarc.json + CLI flag merge
│       └── index.ts                   # commander, injection, no domain logic
├── tests/
│   ├── unit/core/                     # pure function tests — no mocks
│   └── acceptance/                    # subprocess tests — real adapters
├── .dependency-cruiser.cjs            # enforces core ↛ shell
└── vitest.config.ts
```

### Technology Stack

| Concern | Choice | Version |
|---------|--------|---------|
| Runtime | Node.js | 22.18 |
| Language | TypeScript (type-stripped) | — |
| Module system | ESM | — |
| CLI framework | commander | ^12 |
| Git access | `child_process.execSync` | stdlib |
| Health analysis | `npx fallow` | ≥2.76 |
| Testing | Vitest | ^3 |
| Boundary enforcement | dependency-cruiser | ^16 |
| User config | `.ccarc.json` | — |

### Component Inventory (shipped — DELIVER wave 2026-05-20)

| Component | Status | Notes |
|-----------|--------|-------|
| `src/core/classify-file.ts` | SHIPPED | classifyFile, DEFAULT_EXCLUDE_PATTERNS |
| `src/core/estimate-cost.ts` | SHIPPED | estimateCost — unified diff parser |
| `src/core/compute-hours.ts` | SHIPPED | computeHours, THROUGHPUT_RATES, METHODOLOGY_NOTE |
| `src/core/parse-commits.ts` | SHIPPED | parseCommits |
| `src/core/detect-sessions.ts` | SHIPPED | detectSessions |
| `src/core/format.ts` | SHIPPED | formatSummary, formatJson |
| `src/core/analyse.ts` | SHIPPED | pipeline orchestrator, accepts Ports |
| `src/shell/git-adapter.ts` | SHIPPED | createGitAdapter (execSync) |
| `src/shell/health-adapter.ts` | SHIPPED | createHealthAdapter (null stub — Slice 2 deferred) |
| `src/shell/config-loader.ts` | SHIPPED | loadConfig (.ccarc.json + CLI flags) |
| `src/index.ts` | SHIPPED | Imperative Shell — adapter injection, output dispatch |
| `.dependency-cruiser.cjs` | SHIPPED | enforces core/ ↛ shell/ |
| fallow health adapter (real) | DEFERRED | Slice 2 — requires fallow CLI integration |
| `--dev-rate` USD conversion | DEFERRED | AC-4.5 — not in Slice 1 scope |

### Key Decisions

See ADRs:
- [ADR-01](adr-01-type-stripped-ts.md) — Type-stripped TypeScript over tsc compile step
- [ADR-02](adr-02-pure-core-shell.md) — Pure Core / Imperative Shell with explicit port contracts
- [ADR-03](adr-03-execsync-over-simple-git.md) — execSync over simple-git
- [ADR-04](adr-04-health-adapter-deferred.md) — fallow health adapter stubbed to null for Slice 1
- [ADR-05](adr-05-single-package.md) — Single package over @cca/core + @cca/cli monorepo split
- [ADR-06](adr-06-estimator-port.md) — Pluggable Estimator port at `(diff: string) => EffortEstimate`
