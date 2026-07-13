# Add full-chain (100k block) import stats to the perf graph

## Goal

Show the picofuzz **full-chain** (100k-block) import stats on the performance
stats page (`perf-graph/`, deployed to GitHub Pages as "typeberry import
stats"), alongside the existing per-scenario charts (`conformance`, `fallback`,
`safrole`, `storage`, `storage_light`).

## Context

- The perf page renders one `<Chart>` per scenario. Each chart loads a CSV from
  `perf-graph/public/<name>.csv` with the 20-field stats format
  (`projectName,date,count,sum,mean,median,min,max,range,stdDeviation,variance,p1,p5,p10,p25,p50,p75,p90,p95,p99`).
- The **Picofuzz Full Chain** workflow (`.github/workflows/picofuzz-full.yml` →
  `tests/picofuzz/full_chain.test.ts`) already emits `full_chain.csv` in exactly
  this format, uploaded as artifact `picofuzz-csv-full_chain`. Each run chains
  the previous run's CSV, so the latest artifact holds the full accumulated
  history (~10 rows as of 2026-07-13, versions v0.9.x–v0.11.x, `count=100051`).
- The deploy (`deploy-perf-graph.yml`) is triggered by the **Picofuzz Tests**
  workflow and downloads `picofuzz-csv-*` artifacts *from that triggering run
  only*. The full-chain artifact lives in a **different** workflow's runs, so it
  is not currently picked up.

## Design

### 1. Frontend (`perf-graph/`)
- Add an optional `title?: string` prop to `Chart` so the heading can read
  "Full chain import (100k blocks)" instead of the raw `name`. Existing charts
  fall back to `name` (unchanged behaviour).
- Render a dedicated `<Chart name="full_chain" title="..." />` in its own
  section in `App.tsx` (mirroring the `conformance-section`), conceptually
  separate from the per-scenario fuzzers.
- No changes to data parsing or the global version filter — `full_chain` shares
  the `v0.x.x` version namespace and plugs into the existing filter as-is.

### 2. Deploy wiring (`deploy-perf-graph.yml`)
- Add a step that resolves the latest **successful** "Picofuzz Full Chain" run
  via the GitHub API and downloads its `picofuzz-csv-full_chain` artifact into
  `./csv-artifacts/` (`continue-on-error`, mirroring the existing download).
  `merge-csvs.ts` globs whatever CSVs exist, so `full_chain.csv` is merged with
  no merge-script change.
- Add "Picofuzz Full Chain" to the `workflow_run.workflows` trigger list so a
  fresh full-chain result redeploys the page the same day. (Deploy runs on
  `ubuntu-latest`, not the shared self-hosted runner — no runner contention.)

### 3. Seed data
- Commit the current 10-row history as `perf-graph/public/full_chain.csv`,
  consistent with the already-committed `fallback.csv` etc. The artifact has
  90-day retention, so the repo copy is the long-term history base that merge
  builds on.

## Testing
- `npm run build` in `perf-graph/` with the seeded CSV → confirms the chart
  parses and renders.
- Run `merge-csvs.ts` against a `csv-artifacts/full_chain.csv` → confirms merge
  picks it up and dedups by `(version,date)`.
- The API-fetch workflow step is validated on CI; it is a mirror of the existing
  working `download-artifact` step.

## Out of scope
- The `docker-imports-full` wall-clock flow (a separate, larger project that
  would require inventing a new metric and chart type).
