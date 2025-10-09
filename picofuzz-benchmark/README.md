# Picofuzz benchmark

This directory contains scripts for running picofuzz benchmarks on latest typeberry docker image.

## Scripts

### `setup.sh`

Prepares the environment for benchmark tests:
- Installs npm dependencies
- Builds the picofuzz Docker image
- Creates result directories

**Usage:**
```bash
./setup.sh
```

### `index.ts`

Runs all benchmark tests and generates a comparison report:
- Runs picofuzz tests: fallback, safrole, storage, storage_light
- Fetches baseline statistics from https://typeberry.fluffylabs.dev/
- Compares current results with baseline
- Generates a markdown report with performance metrics

**Usage:**
```bash
npm start
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
npm run setup

# 3. Run benchmarks
npm start

# 4. View the report
cat benchmark-report.md
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
