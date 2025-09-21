# Typeberry Testing

E2E tests for [Typeberry](https://github.com/FluffyLabs/typeberry) - a JAM service implementation by Fluffy Labs.

## Test Status

[![Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml)

### Individual Test Jobs

| Test Category | Status | Description |
|---------------|--------|-------------|
| **Docker Works** | [![Docker Works Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=docker-works)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Tests Docker image functionality and basic operations |
| **NPM Works** | [![NPM Works Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=npm-works)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Tests NPM package installation and basic functionality |
| **Minifuzz Burn** | [![Minifuzz Burn Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=minifuzz-burn)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Burn-in testing for extended fuzzing operations |
| **Minifuzz Faulty** | [![Minifuzz Faulty Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=minifuzz-faulty)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Tests error handling and fault tolerance |
| **Minifuzz Forks** | [![Minifuzz Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=minifuzz-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Tests fork handling and process management |
| **Minifuzz No Forks** | [![Minifuzz No Forks Test](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml/badge.svg?job=minifuzz-no-forks)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/tests.yml) | Tests single-process operation without forking |

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
npx tsx --test tests/docker-works.test.ts

# NPM package tests
npx tsx --test tests/npm-works.test.ts

# Minifuzz tests
npx tsx --test tests/minifuzz/burn.test.ts
npx tsx --test tests/minifuzz/faulty.test.ts
npx tsx --test tests/minifuzz/forks.test.ts
npx tsx --test tests/minifuzz/no_forks.test.ts
```

## Project Structure

```
├── tests/
│   ├── docker-works.test.ts     # Docker image functionality tests
│   ├── npm-works.test.ts        # NPM package tests
│   └── minifuzz/                # Fuzzing-related tests
│       ├── burn.test.ts         # Burn-in testing
│       ├── faulty.test.ts       # Fault tolerance tests
│       ├── forks.test.ts        # Fork handling tests
│       └── no_forks.test.ts     # Single-process tests
├── runner/                      # Test runner utilities
└── utils/                       # Shared utilities
```

## Contributing

This repository contains end-to-end tests for the Typeberry project. Each test suite runs in isolation as separate CI jobs to provide granular feedback on different aspects of the system.

## License

Mozilla Public License 2.0 (MPL-2.0)