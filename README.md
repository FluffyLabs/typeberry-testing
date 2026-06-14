# Typeberry Testing

E2E tests for [Typeberry](https://github.com/FluffyLabs/typeberry) - a JAM node implementation by Fluffy Labs.

Check out our performance statistics over time at [typeberry.fluffylabs.dev](https://typeberry.fluffylabs.dev/).

## Status

[![Minifuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml)
[![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml)
[![NPM Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml)
[![NPM Imports](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml)
[![NPM Minifuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml)
[![Docker Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml)
[![Docker Imports](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports.yml)
[![Docker Conformance](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml)
[![Docker Test Vectors](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml)
[![Docker Imports Full](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports-full.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports-full.yml)
[![Picofuzz Full Chain](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz-full.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz-full.yml)

| Test Category | Status | Description |
|---------------|--------|-------------|
| **Docker Works** | [![Docker Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml) | Tests Docker image functionality and basic operations |
| **Docker Imports** | [![Docker Imports](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports.yml) | Docker image is able to import standard block dumps |
| **Docker Imports Full** | [![Docker Imports Full](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports-full.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-imports-full.yml) | Imports the 100k-block full-chainspec dump (nightly; dump fetched from a release asset). Multi-hour soak — runs on a dedicated beefier `non-perf` runner. |
| **Docker Conformance** | [![Docker Conformance](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml) | Tests JAM conformance using Docker with latest conformance test suite |
| **Docker Test Vectors** | [![Docker Test Vectors](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml) | Tests W3F test vectors using Docker with latest test suite |
| **NPM Works** | [![NPM Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml) | Tests NPM package installation and basic functionality |
| **NPM Imports** | [![NPM Imports](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml) | NPM package (in a thin docker image) imports standard block dumps |
| **NPM Minifuzz Tests** | [![NPM Minifuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml) | Minifuzz against the NPM package (thin docker image) |
| **Picofuzz Fallback** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests fallback functionality using prepared fuzz messages |
| **Picofuzz Safrole** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests Safrole protocol implementation with fuzzing |
| **Picofuzz Storage** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests storage functionality with comprehensive fuzzing |
| **Picofuzz Storage Light** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests storage functionality with lightweight fuzzing |
| **Picofuzz Full Chain** | [![Picofuzz Full Chain](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz-full.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz-full.yml) | Imports the 100k-block full-chainspec dump via the fuzz protocol (nightly, perf stats). Multi-hour soak — runs on a dedicated beefier `non-perf` runner. |
| **Minifuzz Burn** | [![Minifuzz Burn Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-burn)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Burn-in testing for extended fuzzing operations |
| **Minifuzz Forks** | [![Minifuzz Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Tests fork handling and process management |
| **Minifuzz No Forks** | [![Minifuzz No Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-no-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Tests single-process operation without forking |

## Standalone tools

- [picofuzz](./picofuzz)
- [perf-graph](./perf-graph)

## Running Tests

### Prerequisites

- Node.js 20+
- Docker
- npm

### Setup

```bash
# Clone the repository with recursive submodules
git clone --recursive https://github.com/FluffyLabs/typeberry-testing.git

# Or if already cloned, initialize submodules recursively
git submodule update --init --recursive

# Install dependencies
npm install

# Provision the typeberry image under test (tagged `typeberry:test`).
# TARGET: docker (published image) | npm (npm package, wrapped in a docker image) | source (build w/ test-runner)
# VERSION: defaults to `next` (latest main); pin with `<semver>-<sha>` or `<semver>`.
TARGET=npm bash .github/actions/provision-typeberry/provision.sh
```

#### Submodules

This repository uses the following submodules:

- **[picofuzz-conformance-data](https://github.com/FluffyLabs/picofuzz-conformance-data/30c951073a991d40246da45ad2293c8c265bdc52)**
    JAM conformance traces for picofuzz execution.
- **[picofuzz-stf-data](https://github.com/FluffyLabs/picofuzz-data/commit/3a85eae167d7ed09778613aa82d0f36ac01339a2)**
    JAM test vectors for picofuzz execution.
- **[picofuzz-full-chain-data](https://github.com/FluffyLabs/picofuzz-full-chain-data)**
    Full-chainspec 100k-block fuzz-message dataset (~150 MB). **Not initialized by
    default** (`update = none`); opt in with:
    `git -c submodule.picofuzz-full-chain-data.update=checkout submodule update --init picofuzz-full-chain-data`

### Running All Tests

```bash
npm test
```

> **Note:** `npm test` runs **all** `*.test.ts` files, including the ~1.5 h full-chain
> dump tests below — prefer running individual test files.

### Running Individual Tests

```bash
# Docker functionality tests
npm exec tsx --test tests/docker-works.test.ts

# Docker conformance tests
npm exec tsx --test tests/docker-conformance.test.ts

# Docker test vectors
npm exec tsx --test tests/docker-test-vectors.test.ts

# Picofuzz tests
npm exec tsx --test tests/picofuzz/fallback.test.ts
npm exec tsx --test tests/picofuzz/safrole.test.ts
npm exec tsx --test tests/picofuzz/storage.test.ts
npm exec tsx --test tests/picofuzz/storage_light.test.ts

# Minifuzz tests
npm exec tsx --test tests/minifuzz/burn.test.ts
npm exec tsx --test tests/minifuzz/faulty.test.ts
npm exec tsx --test tests/minifuzz/forks.test.ts
npm exec tsx --test tests/minifuzz/no_forks.test.ts

# Full-chain dump tests (long: ~1.5h each; dump fetched via block-dumps/full/fetch.sh)
npm exec tsx --test tests/docker-imports-full.test.ts
npm exec tsx --test tests/picofuzz/full_chain.test.ts
```

### Running Picofuzz

Picofuzz is a lightweight fuzzing tool that sends prepared fuzz messages using the Fuzz protocol:

```bash
# Run picofuzz directly
npm start -w @fluffylabs/picofuzz [options] <directory> <socket>

# Options:
#   -f, --flavour <spec>      JAM spec: tiny | full (default: tiny)
#   -r, --repeat  <count>     Number of repetitions (default: 1)
#   -s, --stats   <file>      Append aggregated stats to a CSV file
#   -h, --help                Show help

# Examples:
npm start -w @fluffylabs/picofuzz picofuzz-stf-data/picofuzz-data/fallback /tmp/jam_target.sock
npm start -w @fluffylabs/picofuzz -r 10 picofuzz-stf-data/picofuzz-data/safrole /tmp/jam_target.sock
npm start -w @fluffylabs/picofuzz -s results.csv picofuzz-stf-data/picofuzz-data/storage /tmp/jam_target.sock

See more details about [picofuzz](./picofuzz).

# Using Docker
cd picofuzz
docker build -t picofuzz .
docker run picofuzz [options] <directory> <socket>
```

## PR Benchmark Workflow

The [PR Benchmark workflow](./.github/workflows/pr-benchmark.yml) allows you to test and benchmark PRs from the [typeberry repository](https://github.com/FluffyLabs/typeberry) before merging. It runs the complete picofuzz test suite against a specific Docker image build and compares the results with baseline performance metrics.

### Usage

**Manual Trigger:**
1. Go to [Actions > PR Benchmark](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/pr-benchmark.yml)
2. Click "Run workflow"
3. Enter the PR number from fluffylabs/typeberry (e.g., `704`)

The workflow will automatically find the latest successful build-docker workflow run for that PR.

**Automated Trigger:**
```bash
curl -X POST \
  -H "Authorization: token YOUR_PAT" \
  https://api.github.com/repos/FluffyLabs/typeberry-testing/dispatches \
  -d '{"event_type": "benchmark-pr", "client_payload": {"pr_number": "704"}}'
```

**Requirements:**
- `TYPEBERRY_PAT` secret with permissions to read artifacts and post comments to fluffylabs/typeberry

## Project Structure

```
├── tests/
│   ├── docker-works.test.ts        # Docker image functionality tests
│   ├── docker-conformance.test.ts  # JAM conformance tests using Docker
│   ├── docker-test-vectors.test.ts # W3F test vectors using Docker
│   ├── picofuzz/                   # Performance testing
│   │   ├── common.ts               # Common utilities for picofuzz tests
│   │   ├── fallback.test.ts        # Fallback performance
│   │   ├── safrole.test.ts         # Safrole performance
│   │   ├── storage.test.ts         # Storage performance
│   │   └── storage_light.test.ts   # Lightweight storage performance
│   └── minifuzz/                   # Minifuzz compatibility
│       ├── burn.test.ts            # Repeated execution
│       ├── faulty.test.ts          # Fault tolerance tests
│       ├── forks.test.ts           # Fork handling tests
│       └── no_forks.test.ts        # Single-chain tests
├── picofuzz/                       # Performance testing
│   ├── index.ts                    # Main entry point
│   ├── args.ts                     # Argument parsing
│   ├── files.ts                    # File processing utilities
│   ├── socket.ts                   # Socket communication
│   ├── stats.ts                    # Statistics collection
│   └── package.json                # Package configuration
```

## Contributing

This repository contains end-to-end tests for the Typeberry project. Each test suite runs in isolation as separate CI jobs to provide granular feedback on different aspects of the system.

## License

Mozilla Public License 2.0 (MPL-2.0)
