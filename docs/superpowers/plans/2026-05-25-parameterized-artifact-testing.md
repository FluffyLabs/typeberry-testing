# Version-parameterized artifact testing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Test typeberry's published docker + npm artifacts (npm wrapped in a thin docker image) at any version via a single derived `version` input, and build from source only for the test-runner (conformance/test-vectors).

**Architecture:** A composite action `provision-typeberry` derives per-target identifiers from one `version` input and produces a local image tagged `typeberry:test` three ways — `docker pull` (published), `docker build npm.Dockerfile` (thin npm wrapper), or `docker build source.Dockerfile` (source w/ test-runner). All test suites run against `typeberry:test` (via `TYPEBERRY_IMAGE`). Workflows keep their two-job init+test shape; only the provisioning step changes.

**Tech Stack:** Docker, Node 24/25, npm workspaces, `tsx`, node:test, GitHub Actions composite actions, bash.

**Spec:** `docs/superpowers/specs/2026-05-25-parameterized-artifact-testing-design.md`
**Branch:** `parameterized-artifact-testing` (already checked out, from `main`).

**Commit note:** GPG signing needs an interactive passphrase the agent can't provide. If `git commit` fails with "gpg: signing failed", re-run the same command with `--no-gpg-sign` appended.

**Scope note (read first):** This plan delivers the provisioning machinery + npm/source images + the works/imports/minifuzz/test-runner workflows (docker AND npm where clean) + pr-benchmark + README. It **defers** to a follow-up plan: `npm-perf`, renaming workflows to the `docker-*`/`conformance`/`test-vectors` scheme, and the `deploy-perf-graph` rework — because perf carries an unresolved shared-baseline decision and a `deploy-perf-graph` name coupling. `picofuzz.yml` is converted in place (keeps its name) so the perf graph keeps working.

**Precondition:** Published per-version docker tags (`:next`, `:<semver>-<sha>`, `:<semver>`) require typeberry's publishing change. Until it ships, `target=docker` jobs stay red; `target=npm` (npm `@next`/`@<ver>` already exist) and `target=source` work today. Local verification below uses `npm`/`source` targets and the published npm `0.6.1`.

---

### Task 1: `npm.Dockerfile` — thin npm-wrapper image

**Files:**
- Create: `npm.Dockerfile`

- [ ] **Step 1: Create `npm.Dockerfile`**

```dockerfile
# Thin image that wraps a PUBLISHED @typeberry/jam npm release, so the npm target
# runs inside a container identical in shape to the published docker image
# (same shared-volume/socket IPC and cgroup limits as the docker target).
FROM --platform=linux/amd64 node:25-bookworm-slim

# Published npm version: `next` (newest main) or an exact version like
# `0.7.0-fcf0085` / `0.7.0`. provision-typeberry resolves `next` to a concrete
# version before building so the install layer cache stays correct.
ARG NPM_VERSION=next

RUN useradd -d /app -m typeberry
WORKDIR /app
RUN npm install -g "@typeberry/jam@${NPM_VERSION}"

# Anyone must be able to create the database directory at runtime.
RUN mkdir -p ./database && chmod 777 ./database

USER typeberry

# The `jam` bin is the package's index.js; CLI args (--help, fuzz-target,
# import ...) append as docker CMD args, exactly like the published image.
ENTRYPOINT ["jam"]
```

- [ ] **Step 2: Build against a real published version**

Run: `docker build -f npm.Dockerfile --platform=linux/amd64 --build-arg NPM_VERSION=0.6.1 -t typeberry-npm-check .`
Expected: build succeeds (`naming to docker.io/library/typeberry-npm-check`).

- [ ] **Step 3: Verify the CLI runs**

Run: `docker run --rm --platform=linux/amd64 typeberry-npm-check --help`
Expected: prints the banner containing `typeberry/jam` and `by Fluffy Labs`, listing `import`, `export`, `fuzz-target`.

- [ ] **Step 4: Commit**

```bash
git add npm.Dockerfile
git commit -m "feat: add thin npm-wrapper Dockerfile"
```

---

### Task 2: `source.Dockerfile` — source build with test-runner

**Files:**
- Create: `source.Dockerfile`

- [ ] **Step 1: Create `source.Dockerfile`**

```dockerfile
# Builds typeberry from source at a git ref. Used only by the test-runner suites
# (conformance / test-vectors), which need the @typeberry/test-runner workspace
# that is NOT in the published artifacts. Mirrors typeberry's run-from-source
# layout (WORKDIR /app, full workspaces, `npm start` entrypoint).
FROM --platform=linux/amd64 node:25-bookworm-slim

# Commit SHA, tag, or branch. provision-typeberry resolves `main` to a concrete
# SHA before building so the clone layer cache stays correct.
ARG TYPEBERRY_REF=main

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN git clone https://github.com/FluffyLabs/typeberry . \
    && git checkout "$TYPEBERRY_REF"
RUN npm ci
RUN mkdir -p ./database && chmod 777 ./database
ENTRYPOINT ["npm", "start", "--"]
```

- [ ] **Step 2: Build a released tag**

Run: `docker build -f source.Dockerfile --platform=linux/amd64 --build-arg TYPEBERRY_REF=v0.6.1 -t typeberry-source-check .`
Expected: build succeeds (clone + `npm ci`; takes a few minutes).

- [ ] **Step 3: Verify the test-runner workspace is present**

Run: `docker run --rm --platform=linux/amd64 --entrypoint sh typeberry-source-check -c "test -f bin/test-runner/package.json && echo HAS_TEST_RUNNER"`
Expected: prints `HAS_TEST_RUNNER`.

- [ ] **Step 4: Verify the CLI runs**

Run: `docker run --rm --platform=linux/amd64 typeberry-source-check --help`
Expected: prints the typeberry banner (`by Fluffy Labs`).

- [ ] **Step 5: Commit**

```bash
git add source.Dockerfile
git commit -m "feat: add source Dockerfile (with test-runner) for conformance/test-vectors"
```

---

### Task 3: `provision-typeberry` composite action + script

**Files:**
- Create: `.github/actions/provision-typeberry/provision.sh`
- Create: `.github/actions/provision-typeberry/action.yml`

- [ ] **Step 1: Create `.github/actions/provision-typeberry/provision.sh`**

```bash
#!/usr/bin/env bash
# Provision the typeberry image under test as `typeberry:test`.
#
# Inputs (env):
#   TARGET   docker | npm | source
#   VERSION  next (default) | <semver>-<sha> | <semver>
#
# Derivation:
#   next            -> docker :next   / npm @next   / source main
#   X.Y.Z-<sha>     -> docker :V      / npm @V      / source <sha>
#   X.Y.Z           -> docker :V      / npm @V      / source v<X.Y.Z>
set -euo pipefail

TARGET="${TARGET:?set TARGET to docker|npm|source}"
VERSION="${VERSION:-next}"
ROOT="${GITHUB_WORKSPACE:-$PWD}"
IMAGE="typeberry:test"
REPO_URL="https://github.com/FluffyLabs/typeberry"

if [ "$VERSION" = "next" ]; then
  DOCKER_TAG="next"; NPM_VERSION="next"; SRC_REF="main"
elif [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+-[0-9a-fA-F]+$ ]]; then
  DOCKER_TAG="$VERSION"; NPM_VERSION="$VERSION"; SRC_REF="${VERSION#*-}"
elif [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  DOCKER_TAG="$VERSION"; NPM_VERSION="$VERSION"; SRC_REF="v$VERSION"
else
  echo "Unrecognized version '$VERSION' (expected: next | X.Y.Z-<sha> | X.Y.Z)" >&2
  exit 1
fi

case "$TARGET" in
  docker)
    echo "Provisioning $IMAGE from ghcr.io/fluffylabs/typeberry:$DOCKER_TAG"
    docker pull --platform=linux/amd64 "ghcr.io/fluffylabs/typeberry:$DOCKER_TAG"
    docker tag "ghcr.io/fluffylabs/typeberry:$DOCKER_TAG" "$IMAGE"
    ;;
  npm)
    # Resolve the moving `next` dist-tag to a concrete version so the
    # `npm install` layer is rebuilt when @next advances.
    if [ "$NPM_VERSION" = "next" ]; then
      NPM_VERSION="$(npm view @typeberry/jam@next version 2>/dev/null || echo next)"
    fi
    echo "Provisioning $IMAGE from npm @typeberry/jam@$NPM_VERSION"
    docker build -f "$ROOT/npm.Dockerfile" --platform=linux/amd64 \
      --build-arg "NPM_VERSION=$NPM_VERSION" -t "$IMAGE" "$ROOT"
    ;;
  source)
    # Resolve moving `main` to a concrete SHA (awk consumes all input so git does
    # not get SIGPIPE under `set -o pipefail`).
    if [ "$SRC_REF" = "main" ]; then
      RESOLVED="$(git ls-remote "$REPO_URL" main | awk 'NR==1{print $1}')"
      SRC_REF="${RESOLVED:-main}"
    fi
    echo "Provisioning $IMAGE from typeberry source ref $SRC_REF"
    docker build -f "$ROOT/source.Dockerfile" --platform=linux/amd64 \
      --build-arg "TYPEBERRY_REF=$SRC_REF" -t "$IMAGE" "$ROOT"
    ;;
  *)
    echo "Unknown TARGET '$TARGET' (expected docker|npm|source)" >&2; exit 1 ;;
esac

echo "Tagged $IMAGE"
```

- [ ] **Step 2: Create `.github/actions/provision-typeberry/action.yml`**

```yaml
name: Provision Typeberry image
description: Fetch or build the typeberry image for a version and tag it `typeberry:test`.
inputs:
  target:
    description: 'docker | npm | source'
    required: true
  version:
    description: 'next (default) | <semver>-<sha> | <semver>'
    required: false
    default: 'next'
runs:
  using: composite
  steps:
    - shell: bash
      run: bash "${{ github.action_path }}/provision.sh"
      env:
        TARGET: ${{ inputs.target }}
        VERSION: ${{ inputs.version }}
```

- [ ] **Step 3: Make the script executable**

Run: `chmod +x .github/actions/provision-typeberry/provision.sh`

- [ ] **Step 4: Verify version derivation (no docker needed)**

Run:
```bash
for v in next 0.7.0-fcf0085 0.7.0 garbage; do
  echo "== $v =="
  TARGET=invalid VERSION="$v" bash .github/actions/provision-typeberry/provision.sh 2>&1 | head -1 || true
done
```
Expected: `next`, `0.7.0-fcf0085`, `0.7.0` reach the `Unknown TARGET 'invalid'` line (derivation passed); `garbage` prints `Unrecognized version 'garbage'`.

- [ ] **Step 5: Verify npm-target provisioning end to end**

Run: `TARGET=npm VERSION=0.6.1 GITHUB_WORKSPACE="$PWD" bash .github/actions/provision-typeberry/provision.sh && docker run --rm --platform=linux/amd64 typeberry:test --help`
Expected: builds `typeberry:test` from npm `0.6.1`, then `--help` prints the banner.

- [ ] **Step 6: Verify source-target provisioning**

Run: `TARGET=source VERSION=v0.6.1 GITHUB_WORKSPACE="$PWD" bash .github/actions/provision-typeberry/provision.sh && docker run --rm --entrypoint sh --platform=linux/amd64 typeberry:test -c "test -f bin/test-runner/package.json && echo HAS_TEST_RUNNER"`
Expected: builds `typeberry:test` from source `v0.6.1`, prints `HAS_TEST_RUNNER`.

- [ ] **Step 7: Commit**

```bash
git add .github/actions/provision-typeberry/
git commit -m "feat: add provision-typeberry composite action (docker/npm/source -> typeberry:test)"
```

---

### Task 4: Select test image via `TYPEBERRY_IMAGE` (default `typeberry:test`)

**Files:**
- Modify: `tests/common.ts`
- Modify: `tests/docker-works.test.ts`, `tests/docker-imports.test.ts`, `tests/docker-conformance.test.ts`, `tests/docker-test-vectors.test.ts`
- Delete: `tests/npm-works.test.ts`, `tests/npm-next-works.test.ts`

- [ ] **Step 1: Add the exported constant in `tests/common.ts`**

After the `const SHARED_VOLUME = "jam-ipc-volume";` line, add:

```ts
/**
 * Docker image under test. Defaults to the locally-provisioned `typeberry:test`
 * (built/fetched by the provision-typeberry action). Set TYPEBERRY_IMAGE to
 * override (e.g. pr-benchmark tags its loaded artifact `typeberry:test`).
 */
export const TYPEBERRY_IMAGE = process.env.TYPEBERRY_IMAGE ?? "typeberry:test";
```

- [ ] **Step 2: Use it in the `typeberry()` helper in `tests/common.ts`**

Replace the line `    "ghcr.io/fluffylabs/typeberry:latest",` with `    TYPEBERRY_IMAGE,`.

- [ ] **Step 3: Update the four docker test files**

In EACH of `tests/docker-works.test.ts`, `tests/docker-imports.test.ts`, `tests/docker-conformance.test.ts`, `tests/docker-test-vectors.test.ts`:

Change the import line:
```ts
import { ExternalProcess } from "./external-process.js";
```
to:
```ts
import { TYPEBERRY_IMAGE } from "./common.js";
import { ExternalProcess } from "./external-process.js";
```
Then replace every `"ghcr.io/fluffylabs/typeberry:latest",` with `TYPEBERRY_IMAGE,` (docker-works has TWO occurrences; the other three have ONE each).

- [ ] **Step 4: Delete the obsolete npx-based npm tests**

The npm target is now exercised by running `docker-works.test.ts` / `docker-imports.test.ts` against the npm-wrapper image, so the standalone npx tests are obsolete.

Run: `git rm tests/npm-works.test.ts tests/npm-next-works.test.ts`

- [ ] **Step 5: Verify no hardcoded image refs remain in tests**

Run: `grep -rn "ghcr.io/fluffylabs/typeberry:latest" tests/`
Expected: no output.

- [ ] **Step 6: Lint/format**

Run: `npm run qa`
Expected: biome passes. If it flags import order/format, run `npm run qa-fix` then `npm run qa` again.

- [ ] **Step 7: Verify works suite against `typeberry:test`**

(Reuses the `typeberry:test` image from Task 3 Step 5.)
Run: `TYPEBERRY_IMAGE=typeberry:test npm exec tsx --test tests/docker-works.test.ts`
Expected: both tests pass (`should display help`, `should start fuzz target and gracefuly stop`).

- [ ] **Step 8: Commit**

```bash
git add tests/common.ts tests/docker-works.test.ts tests/docker-imports.test.ts tests/docker-conformance.test.ts tests/docker-test-vectors.test.ts
git commit -m "feat: select docker test image via TYPEBERRY_IMAGE; drop npx npm tests"
```

---

### Task 5: Convert `docker-works.yml` and `docker-imports.yml` (target=docker)

**Files:**
- Modify: `.github/workflows/docker-works.yml`, `.github/workflows/docker-imports.yml`

For EACH of the two files apply both edits:

- [ ] **Step 1: Add the `version` input**

Replace:
```yaml
  workflow_dispatch:
  repository_dispatch:
```
with:
```yaml
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
```

- [ ] **Step 2: Replace the fetch step with provisioning**

Replace:
```yaml
      - name: Fetch Typeberry Docker image
        run: npm run fetch-typeberry
```
with:
```yaml
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: docker
          version: ${{ github.event.inputs.version || 'next' }}
```

- [ ] **Step 3: Verify YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/docker-works.yml')); yaml.safe_load(open('.github/workflows/docker-imports.yml')); print('ok')"`
Expected: `ok`. (If PyYAML unavailable, eyeball indentation.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/docker-works.yml .github/workflows/docker-imports.yml
git commit -m "ci: provision published docker image for works/imports (version input)"
```

---

### Task 6: npm works + imports workflows

**Files:**
- Modify: `.github/workflows/npm-works.yml`
- Create: `.github/workflows/npm-imports.yml`
- Delete: `.github/workflows/npm-next-works.yml`

- [ ] **Step 1: Rewrite `.github/workflows/npm-works.yml`**

Replace the ENTIRE file with (runs the works suite against the npm-wrapper image; note `runs-on` moves to self-hosted because it now uses docker):

```yaml
name: NPM Works

on:
  push:
    branches: [ main ]
  pull_request:
      branches: [ main ]
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
  schedule:
    - cron: '0 6 * * *'
    - cron: '0 10 * * *'
    - cron: '0 14 * * *'
    - cron: '0 18 * * *'
    - cron: '0 22 * * *'

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

jobs:
  init:
    name: Initializing environment
    runs-on: [self-hosted, non-perf]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: npm
          version: ${{ github.event.inputs.version || 'next' }}

  npm-works:
    needs: init
    name: NPM Works Test
    runs-on: [self-hosted, non-perf]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Works test (npm image)
        run: |
          npm exec tsx --test tests/docker-works.test.ts
```

- [ ] **Step 2: Create `.github/workflows/npm-imports.yml`**

```yaml
name: NPM Imports

on:
  push:
    branches: [ main ]
  pull_request:
      branches: [ main ]
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
  schedule:
    - cron: '0 6 * * *'
    - cron: '0 10 * * *'
    - cron: '0 14 * * *'
    - cron: '0 18 * * *'
    - cron: '0 22 * * *'

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

jobs:
  init:
    name: Initializing environment
    runs-on: [self-hosted, non-perf]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: npm
          version: ${{ github.event.inputs.version || 'next' }}

  npm-imports:
    needs: init
    name: NPM Imports Test
    runs-on: [self-hosted, non-perf]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Imports test (npm image)
        run: |
          npm exec tsx --test tests/docker-imports.test.ts
```

- [ ] **Step 3: Remove the now-redundant `@next` workflow**

`@next` is the default of the `version` input, so the dedicated workflow is obsolete.

Run: `git rm .github/workflows/npm-next-works.yml`

- [ ] **Step 4: Verify YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/npm-works.yml')); yaml.safe_load(open('.github/workflows/npm-imports.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/npm-works.yml .github/workflows/npm-imports.yml
git rm .github/workflows/npm-next-works.yml
git commit -m "ci: npm works+imports run the docker suites against the npm-wrapper image"
```

---

### Task 7: minifuzz workflows (docker + npm)

**Files:**
- Modify: `.github/workflows/minifuzz.yml`
- Create: `.github/workflows/npm-minifuzz.yml`

- [ ] **Step 1: Convert `minifuzz.yml` to provision the docker target**

Add the `version` input — replace:
```yaml
  workflow_dispatch:
  repository_dispatch:
```
with:
```yaml
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
```

Then replace the provisioning step — replace:
```yaml
      - name: Fetch Typeberry Docker image
        run: npm run fetch-typeberry
      - name: Build minifuzz
        run: npm run build -w minifuzz
```
with:
```yaml
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: docker
          version: ${{ github.event.inputs.version || 'next' }}
      - name: Build minifuzz
        run: npm run build -w minifuzz
```

- [ ] **Step 2: Create `.github/workflows/npm-minifuzz.yml`**

Identical to `minifuzz.yml` but with `target: npm` and renamed name/badge. Full file:

```yaml
name: NPM Minifuzz Tests

on:
  push:
    branches: [ main ]
  pull_request:
      branches: [ main ]
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
  schedule:
    - cron: '0 6 * * *'
    - cron: '0 10 * * *'
    - cron: '0 14 * * *'
    - cron: '0 18 * * *'
    - cron: '0 22 * * *'

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

jobs:
  init:
    name: Initializing environment
    runs-on: [self-hosted, non-perf]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: npm
          version: ${{ github.event.inputs.version || 'next' }}
      - name: Build minifuzz
        run: npm run build -w minifuzz

  minifuzz:
    needs: init
    name: NPM Minifuzz Tests
    runs-on: [self-hosted, non-perf]
    strategy:
      fail-fast: false
      matrix:
        test: [burn, forks, no_forks]
    steps:
      - uses: actions/checkout@v6
        with:
          submodules: 'recursive'
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Minifuzz ${{ matrix.test }} test (npm image)
        run: |
          npm exec tsx --test tests/minifuzz/${{ matrix.test }}.test.ts
```

- [ ] **Step 3: Verify YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/minifuzz.yml')); yaml.safe_load(open('.github/workflows/npm-minifuzz.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/minifuzz.yml .github/workflows/npm-minifuzz.yml
git commit -m "ci: minifuzz against docker + npm images (version input)"
```

---

### Task 8: Convert `picofuzz.yml` (perf) to provision the docker target

Keeps the workflow name "Picofuzz Tests" (deploy-perf-graph triggers on it). `npm-perf` + rename are a follow-up.

**Files:**
- Modify: `.github/workflows/picofuzz.yml`

- [ ] **Step 1: Add the `version` input**

Replace:
```yaml
  workflow_dispatch:
  repository_dispatch:
```
with:
```yaml
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
```

- [ ] **Step 2: Replace the fetch step with provisioning**

Replace:
```yaml
      - name: Fetch Typeberry Docker image
        run: npm run fetch-typeberry
      - name: Build picofuzz
        run: npm run build-docker -w @fluffylabs/picofuzz
```
with:
```yaml
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: docker
          version: ${{ github.event.inputs.version || 'next' }}
      - name: Build picofuzz
        run: npm run build-docker -w @fluffylabs/picofuzz
```

- [ ] **Step 3: Verify YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/picofuzz.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/picofuzz.yml
git commit -m "ci: provision published docker image for picofuzz perf (version input)"
```

---

### Task 9: test-runner workflows (target=source)

**Files:**
- Modify: `.github/workflows/docker-conformance.yml`, `.github/workflows/docker-test-vectors.yml`

For EACH file apply both edits:

- [ ] **Step 1: Add the `version` input**

Replace:
```yaml
  workflow_dispatch:
  repository_dispatch:
```
with:
```yaml
  workflow_dispatch:
    inputs:
      version:
        description: 'typeberry version: `next` (default), `<semver>-<sha>` (pre-release), or `<semver>` (release)'
        required: false
        default: 'next'
  repository_dispatch:
```

- [ ] **Step 2: Replace the fetch step with a SOURCE provision**

Replace:
```yaml
      - name: Fetch Typeberry Docker image
        run: npm run fetch-typeberry
```
with:
```yaml
      - name: Provision Typeberry image
        uses: ./.github/actions/provision-typeberry
        with:
          target: source
          version: ${{ github.event.inputs.version || 'next' }}
```

- [ ] **Step 3: Verify YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/docker-conformance.yml')); yaml.safe_load(open('.github/workflows/docker-test-vectors.yml')); print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/docker-conformance.yml .github/workflows/docker-test-vectors.yml
git commit -m "ci: build source image with test-runner for conformance/test-vectors (version input)"
```

---

### Task 10: pr-benchmark retag, drop `fetch-typeberry`, update README

**Files:**
- Modify: `.github/workflows/pr-benchmark.yml`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Point pr-benchmark's loaded artifact at the new tag**

In `.github/workflows/pr-benchmark.yml`, in the "Load docker image" step, replace:
```yaml
          # Tag the image as latest so existing tests work
          docker tag $IMAGE_ID ghcr.io/fluffylabs/typeberry:latest
```
with:
```yaml
          # Tag as the image the tests resolve via TYPEBERRY_IMAGE (default).
          docker tag $IMAGE_ID typeberry:test
```

- [ ] **Step 2: Remove the obsolete `fetch-typeberry` script**

In `package.json`, delete the line:
```json
    "fetch-typeberry": "docker pull --platform=linux/amd64 ghcr.io/fluffylabs/typeberry:latest",
```
Confirm the remaining JSON is valid (the line before — `lint` — keeps its trailing comma; the line after — `test` — is unaffected).

- [ ] **Step 3: Verify nothing still calls `fetch-typeberry`**

Run: `grep -rn "fetch-typeberry" .github/ package.json`
Expected: no output.

- [ ] **Step 4: Update the README Status badges**

In `README.md`, replace the badge block + table rows so the set is: Docker Works, NPM Works, Docker Imports, NPM Imports, Minifuzz Tests, NPM Minifuzz Tests, Picofuzz Tests, Docker Conformance, Docker Test Vectors. Concretely:
- Remove the `NPM @next Works` badge line (line ~12) and its table row (~25).
- Add an `NPM Imports` badge + row:
  ```markdown
  [![NPM Imports](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-imports.yml)
  ```
- Add an `NPM Minifuzz Tests` badge + row:
  ```markdown
  [![NPM Minifuzz Tests](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml/badge.svg)](https://github.com/FluffyLabs/typeberry-testing/actions/workflows/npm-minifuzz.yml)
  ```
- Leave the existing Docker Works / Docker Imports / Docker Conformance / Docker Test Vectors / NPM Works / Minifuzz / Picofuzz badges in place.

- [ ] **Step 5: Validate package.json + show README diff**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')" && git --no-pager diff -- README.md | head -40`
Expected: `package.json valid`; the README diff shows the badge changes.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/pr-benchmark.yml package.json README.md
git commit -m "ci: retag pr-benchmark to typeberry:test; drop fetch-typeberry; update README badges"
```

---

## Post-implementation verification (on a PR / runners)

- [ ] Open a PR from `parameterized-artifact-testing`. The `target=npm` and `target=source` jobs should run end to end (npm `@next` and source `main` exist today). `target=docker` jobs stay red until typeberry publishes `:next` / per-version docker tags (precondition).
- [ ] Dispatch `NPM Imports` with `version=0.6.1`; confirm the run log shows `Provisioning typeberry:test from npm @typeberry/jam@0.6.1` and the import reaches `Best block: #100`.
- [ ] Dispatch `Docker Conformance` with `version=v0.6.1` (or `0.6.1`); confirm it builds the source image and runs the `test-runner` scripts (no missing-workspace error).
- [ ] Confirm `deploy-perf-graph` still triggers off "Picofuzz Tests" (name unchanged).

## Deferred to a follow-up plan (perf + renames)

- `npm-perf.yml`, and whether docker-perf / npm-perf share the `typeberry.fluffylabs.dev` baseline.
- Renaming workflows to the consistent scheme (`docker-perf`, `docker-minifuzz`, `conformance`, `test-vectors`) and updating `deploy-perf-graph.yml` + badge URLs accordingly.
- Build caching to speed up npm/source image builds.
