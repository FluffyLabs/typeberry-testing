# Typeberry Testing

E2E tests for [Typeberry](https://github.com/FluffyLabs/typeberry) - a JAM node implementation by Fluffy Labs.

## Status

[![Minifuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml)
[![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml)
[![NPM Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml)
[![Docker Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml)
[![Docker Conformance](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml)
[![Docker Test Vectors](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml)

| Test Category | Status | Description |
|---------------|--------|-------------|
| **Docker Works** | [![Docker Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-works.yml) | Tests Docker image functionality and basic operations |
| **Docker Conformance** | [![Docker Conformance](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-conformance.yml) | Tests JAM conformance using Docker with latest conformance test suite |
| **Docker Test Vectors** | [![Docker Test Vectors](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/docker-test-vectors.yml) | Tests W3F test vectors using Docker with latest test suite |
| **NPM Works** | [![NPM Works](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-works.yml) | Tests NPM package installation and basic functionality |
| **Picofuzz Fallback** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests fallback functionality using prepared fuzz messages |
| **Picofuzz Safrole** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests Safrole protocol implementation with fuzzing |
| **Picofuzz Storage** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests storage functionality with comprehensive fuzzing |
| **Picofuzz Storage Light** | [![Picofuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/picofuzz.yml) | Tests storage functionality with lightweight fuzzing |
| **Minifuzz Burn** | [![Minifuzz Burn Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-burn)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Burn-in testing for extended fuzzing operations |
| **Minifuzz Faulty** | [![Minifuzz Faulty Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-faulty)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Tests error handling and fault tolerance |
| **Minifuzz Forks** | [![Minifuzz Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Tests fork handling and process management |
| **Minifuzz No Forks** | [![Minifuzz No Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml/badge.svg?job=minifuzz-no-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/minifuzz.yml) | Tests single-process operation without forking |

## Running Tests

### Prerequisites

- Node.js 20+
- Docker
- npm

### Setup

```bash
# Install dependencies
npm install

# Fetch the latest Typeberry Docker image
npm run fetch-typeberry
```

### Running All Tests

```bash
npm test
```

### Running Individual Tests

```bash
# Docker functionality tests
npm exec tsx --test tests/docker-works.test.ts

# Docker conformance tests
npm exec tsx --test tests/docker-conformance.test.ts

# Docker test vectors
npm exec tsx --test tests/docker-test-vectors.test.ts

# NPM package tests
npm exec tsx --test tests/npm-works.test.ts

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
```

### Running Picofuzz

Picofuzz is a lightweight fuzzing tool that sends prepared fuzz messages using the Fuzz protocol:

```bash
# Run picofuzz directly
npm exec tsx picofuzz/index.ts <directory> <socket> [repeat]

# Using Docker
docker build -t picofuzz .
docker run picofuzz <directory> <socket> [repeat]
```

## Project Structure

```
├── tests/
│   ├── docker-works.test.ts        # Docker image functionality tests
│   ├── docker-conformance.test.ts  # JAM conformance tests using Docker
│   ├── docker-test-vectors.test.ts # W3F test vectors using Docker
│   ├── npm-works.test.ts           # NPM package tests
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
