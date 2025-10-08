# PR Benchmark Scripts

This directory contains scripts for running benchmark tests on Typeberry PRs.

## Scripts

### `benchmark-setup.sh`

Prepares the environment for benchmark tests:
- Installs npm dependencies
- Builds the picofuzz Docker image
- Prepares test data
- Creates result directories

**Usage:**
```bash
./benchmark-setup.sh
```

### `benchmark-run.ts`

Runs all benchmark tests and generates a comparison report:
- Runs picofuzz tests: fallback, safrole, storage, storage_light
- Fetches baseline statistics from https://typeberry.fluffylabs.dev/
- Compares current results with baseline
- Generates a markdown report with performance metrics

**Usage:**
```bash
npx tsx benchmark-run.ts
```

**Output:**
- CSV files in `./picofuzz-result/` for each test
- Markdown report in `./benchmark-report.md`

## Running Locally

To run benchmarks locally:

```bash
# 1. Ensure you have the typeberry docker image
docker pull ghcr.io/fluffylabs/typeberry:latest

# Or load a custom image
docker load -i typeberry-image.tar
docker tag <image-id> ghcr.io/fluffylabs/typeberry:latest

# 2. Run setup
bash .github/scripts/benchmark-setup.sh

# 3. Run benchmarks
npx tsx .github/scripts/benchmark-run.ts

# 4. View the report
cat benchmark-report.md
```

## Environment Variables

The scripts respect the following environment variables:

- `GITHUB_SERVER_URL` - GitHub server URL (for report links)
- `GITHUB_REPOSITORY` - Repository name (for report links)
- `GITHUB_RUN_ID` - Workflow run ID (for report links)

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
