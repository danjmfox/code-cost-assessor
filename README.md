# Code Cost Assessor

Estimates the manual development effort equivalent of an AI-built codebase by analysing its git history.

## Usage

```bash
# Session cost timeline (summary)
cca analyse ./my-repo

# Machine-readable JSON for benchmarking
cca analyse ./my-repo --format json

# Write JSON to file
cca analyse ./my-repo --format json --output report.json

# Adjust session gap (default: 3 hours)
cca analyse ./my-repo --session-gap 2
```

## Methodology

Uses the **Swoopy token-weighted model** to convert git diff character counts into estimated manual hours.

### Formula

```
tokens  = characters_added / 3.5
hours   = (tokens / throughput_rate) × 8
```

### Throughput rates (tokens/day)

| Category | Rate | Description |
|----------|------|-------------|
| source   | 250  | TypeScript/JavaScript source files |
| test     | 400  | Test files |
| doc      | 500  | Markdown and documentation |
| config   | 600  | JSON, config files |

### Session detection

Commits are grouped into sessions using a configurable time gap (default: 3 hours). A new session begins when the inter-commit gap exceeds this threshold.

### Confidence

All estimates carry a **±40% confidence interval**. This reflects natural variance in developer productivity. Use the numbers for order-of-magnitude comparisons, not precise billing.

## Output

### Summary (default)

```
Code Cost Assessor — Session Analysis
══════════════════════════════════════════════════════════════
Repository: /path/to/repo
Analysed:   2026-05-20
Commits:    144 (non-merge, grouped into 18 sessions)

Session  Date        Commits  Est. Hours  Confidence
──────────────────────────────────────────────────────────────
      1  2026-03-01       12         240  ±40%
      ...
TOTAL                   144        4725h ±40%

Methodology: Swoopy token-weighted model
  Throughput: source 250, test 400, doc 500, config 600 tokens/day
  Char/token ratio: 1:3.5 | Confidence interval: ±40%
```

### JSON

The `--format json` output conforms to the `AnalysisResult` type:

```json
{
  "repoPath": "/path/to/repo",
  "analysedAt": "2026-05-20T12:00:00.000Z",
  "fromSha": "abc123",
  "toSha": "def456",
  "sessions": [
    {
      "sessionIndex": 1,
      "startTime": "2026-03-01T09:00:00.000Z",
      "endTime": "2026-03-01T17:00:00.000Z",
      "durationHours": 8,
      "commits": [{ "sha": "...", "timestamp": 1740823200 }],
      "effortEstimate": {
        "hours": 240,
        "tokens": 7500,
        "breakdown": {
          "source": { "hours": 200, "tokens": 6000 },
          "test":   { "hours": 30,  "tokens": 800  },
          "doc":    { "hours": 10,  "tokens": 700  },
          "config": { "hours": 0,   "tokens": 0    }
        },
        "confidence": "±40%",
        "note": "Swoopy token-weighted model..."
      },
      "healthDelta": null
    }
  ],
  "totals": {
    "sessions": 18,
    "commits": 144,
    "hours": 4725,
    "tokens": 573000,
    "confidence": "±40%"
  },
  "healthDelta": null
}
```

## Configuration

Create `.ccarc.json` in the target repository root to set defaults:

```json
{
  "sessionGapHours": 2
}
```

CLI flags override file values.

## Exclusions

Lock files, build artefacts, and binary assets are excluded automatically:

- `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `*.lock`
- `dist/`, `node_modules/`, `graphify-out/`
- Image and font files

## Health analysis

Health trajectory overlay (per-session code quality delta) requires `fallow`. When fallow is not installed, `healthDelta` is `null` and a warning is printed to stderr. Core cost estimation works without it.

## Architecture

Pure Core / Imperative Shell. Business logic in `src/core/` (pure functions, no I/O). Git access and config loading in `src/shell/`. Boundary enforced by dependency-cruiser.

See `docs/product/architecture/` for ADRs.
