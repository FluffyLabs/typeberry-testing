# Version-parameterized testing of published artifacts + source test-runner

**Date:** 2026-05-25
**Status:** Approved (design)

## Background & motivation

typeberry is changing its release process so that **every commit on `main`**
publishes both:
- an **npm** package `@typeberry/jam@<version>`, and
- a **docker** image `ghcr.io/fluffylabs/typeberry:<version>`,

where `<version>` is `semver-commitsha` for main commits (e.g. `0.7.0-fcf0085`)
and `semver` for releases (e.g. `0.7.0`). In addition, moving tags track the
newest main commit: docker `:next` and npm dist-tag `@next`.

This testing repo should therefore **test the published artifacts directly** at
any version (for pre-release checks and for released versions), instead of
building typeberry from source for the node binary. The only thing that still
needs source is the **test-runner** (conformance / test-vectors), because
`@typeberry/test-runner` is an internal workspace that is not published.

Two driving goals:
1. Trigger any job for **any committed version** of typeberry (pre-release checks).
2. Also check **released versions**.

## Goals

- Every functional suite runs against a docker image tagged `typeberry:test`,
  provisioned one of three ways: **fetch published docker**, **build a thin npm
  wrapper image**, or **build a source image with the test-runner**.
- A single `version` input per workflow selects what to test, defaulting to
  latest `main` (`:next` / `@next` / source `main`) for scheduled runs.
- Per-(target × test) workflows, each with its own badge, mirroring the current
  README layout.

## Non-goals

- Changing typeberry's publishing (separate, in the typeberry repo) — but it is a
  **precondition** (see below).
- Running npm on the host. The npm target is wrapped in a thin docker image so it
  gets the same container/resource/IPC model as the published docker image
  (apples-to-apples for minifuzz/perf).
- Orchestration / "run-all" workflows. Jobs are independent, each with a `version`
  input; "run everything for a version" = dispatch each with the same value.
- Changing what `pr-benchmark` fetches (still a per-PR build artifact); only a
  one-line retag so it matches the new local image name.

## Precondition (cross-repo dependency)

This depends on typeberry publishing:
- immutable `ghcr.io/fluffylabs/typeberry:<semver-sha>` + `@typeberry/jam@<semver-sha>`
  for each main commit,
- moving `:next` (docker) and `@next` (npm) for the newest main commit,
- `:<semver>` + `@<semver>` for releases.

docker `:next` does not exist today. The testing-repo changes can land first; the
docker jobs will stay red until typeberry's publishing change ships.

## Design

### Provisioning: three modes → one local tag `typeberry:test`

Every suite talks to a docker image tagged `typeberry:test`. Only provisioning
differs, encapsulated in a composite action `.github/actions/provision-typeberry`
(inputs: `target` ∈ {docker, npm, source}, `version`):

- **docker:** `docker pull ghcr.io/fluffylabs/typeberry:<dockerTag>` then
  `docker tag … typeberry:test`.
- **npm:** `docker build -f npm.Dockerfile --build-arg NPM_VERSION=<npmVer> -t typeberry:test .`
  (thin image: `FROM node:25-bookworm-slim; npm i -g @typeberry/jam@<ver>`).
- **source:** `docker build -f source.Dockerfile --build-arg TYPEBERRY_REF=<srcRef> -t typeberry:test .`
  (clone typeberry at the ref, `npm ci`, keep full workspaces incl. test-runner).

The composite action resolves the per-target value from the single `version`
input (table below), provisions, tags `typeberry:test`, and echoes the resolved
docker tag / npm version / source ref for the run log.

### Version derivation (single canonical `version` input)

| `version` input | docker tag | npm version | source ref |
|---|---|---|---|
| `next` (default / scheduled) | `next` | `next` | `main` |
| `<semver>-<sha>` (pre-release, e.g. `0.7.0-fcf0085`) | `<semver>-<sha>` | `<semver>-<sha>` | `<sha>` |
| `<semver>` (release, e.g. `0.7.0`) | `<semver>` | `<semver>` | `v<semver>` |

Derivation rules (in the composite action):
- `version == "next"` → docker `next`, npm `next`, source `main`.
- matches `^[0-9]+\.[0-9]+\.[0-9]+-[0-9a-f]+$` → docker/npm = version; source = the
  part after the first `-`.
- matches `^[0-9]+\.[0-9]+\.[0-9]+$` → docker/npm = version; source = `v` + version.

Published workflows consume docker tag / npm version; source (test-runner)
workflows consume the source ref.

### Dockerfiles

- `npm.Dockerfile` — thin wrapper:
  ```dockerfile
  FROM --platform=linux/amd64 node:25-bookworm-slim
  ARG NPM_VERSION=next
  RUN useradd -d /app -m typeberry
  WORKDIR /app
  RUN npm install -g "@typeberry/jam@${NPM_VERSION}"
  RUN mkdir -p ./database && chmod 777 ./database
  USER typeberry
  ENTRYPOINT ["jam"]
  ```
  The `jam` bin = the package's `index.js`; CLI args (`--help`, `fuzz-target`,
  `import …`) append as docker CMD args, exactly like the published image.
- `source.Dockerfile` — source build for the test-runner (the previously-built
  source Dockerfile, repurposed):
  ```dockerfile
  FROM --platform=linux/amd64 node:25-bookworm-slim
  ARG TYPEBERRY_REF=main
  RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
  WORKDIR /app
  RUN git clone https://github.com/FluffyLabs/typeberry . && git checkout "$TYPEBERRY_REF"
  RUN npm ci
  RUN mkdir -p ./database && chmod 777 ./database
  ENTRYPOINT ["npm", "start", "--"]
  ```
  test-runner suites override the entrypoint (`--entrypoint /bin/bash`) and run
  `npm run <script> -w @typeberry/test-runner …`, so the full workspace must be
  present (it is, via `npm ci` on the cloned source).

### Test harness

`tests/common.ts` exports `TYPEBERRY_IMAGE = process.env.TYPEBERRY_IMAGE ?? "typeberry:test"`,
and the docker-* test files use it (already designed previously). All suites are
target-agnostic — they just run against `typeberry:test`.

### Workflows (one badge each, single job each)

Each workflow: triggers (`push`/`pull_request` on main, `workflow_dispatch` with a
`version` input default `next`, `repository_dispatch`, the five schedule crons);
a single job that checks out, sets up node, `npm ci`, runs
`provision-typeberry` with its fixed `target` + the `version` input, then runs its
test suite against `typeberry:test`. (Single job per workflow — no separate `init`
job — so there is no reliance on a docker image persisting across jobs.)

Published (target fixed per file):
- `docker-works.yml`, `npm-works.yml` → `tests/docker-works.test.ts`
- `docker-imports.yml`, `npm-imports.yml` → `tests/docker-imports.test.ts`
- `docker-minifuzz.yml`, `npm-minifuzz.yml` → minifuzz suite. NOTE: these also
  build the separate minifuzz python harness image (`minifuzz/minifuzz.Dockerfile`,
  via `minifuzz/minifuzz-docker-build.sh`) as today — that step is unchanged and
  independent of the typeberry image provisioning.
- `docker-perf.yml`, `npm-perf.yml` → `npm start -w picofuzz-benchmark`

test-runner (target = source):
- `conformance.yml` → `tests/docker-conformance.test.ts`
- `test-vectors.yml` → `tests/docker-test-vectors.test.ts`

Unchanged in purpose:
- `pr-benchmark.yml` — still loads the per-PR docker artifact. One change: in the
  "Load docker image" step, tag it `typeberry:test` (instead of
  `ghcr.io/fluffylabs/typeberry:latest`) so the picofuzz tests (now using
  `TYPEBERRY_IMAGE`, default `typeberry:test`) find it. No env needed.

`README.md` status section updated to the new per-(target × test) badge set.

## Data flow

```
version input (default "next")
   └─ provision-typeberry(target, version)
        ├─ derive: dockerTag / npmVer / srcRef   (table above)
        ├─ docker  → docker pull ghcr:<dockerTag> → tag typeberry:test
        ├─ npm     → docker build npm.Dockerfile  (NPM_VERSION=<npmVer>) → typeberry:test
        └─ source  → docker build source.Dockerfile (TYPEBERRY_REF=<srcRef>) → typeberry:test
   └─ test suite runs against typeberry:test (TYPEBERRY_IMAGE default)

pr-benchmark: load PR artifact → tag typeberry:test → picofuzz benchmark
```

## Error handling / edge cases

- Bad `version` (no matching docker tag / npm version / git ref): the
  pull/build/clone fails → job fails fast with a clear error.
- npm prerelease versions are valid semver (`0.7.0-fcf0085`); `npm i -g` accepts
  the exact version.
- Native modules: `npm i -g` (npm target) and `npm ci` (source target) fetch/build
  linux/amd64 prebuilds; building on amd64 runners keeps this correct.
- The composite action validates the `version` against the three patterns and
  exits non-zero on no match (prevents silently testing the wrong thing).

## Testing / acceptance

- `provision-typeberry target=docker version=next` → `docker run typeberry:test --help`
  prints the banner (once typeberry publishes `:next`).
- `provision-typeberry target=npm version=<a published version>` → `--help` works;
  `import` reaches `Best block: #100`.
- `provision-typeberry target=source version=next` → conformance/test-vectors run
  the `test-runner` scripts (no missing-workspace error).
- A `workflow_dispatch` of any published workflow with `version=0.7.0-fcf0085`
  pulls/builds that exact artifact; the run log shows the resolved tag/sha.
- `npm run qa` clean; `docker-works` passes against `typeberry:test`.

## Affected files (summary)

- **Create:** `.github/actions/provision-typeberry/action.yml`, `npm.Dockerfile`,
  `source.Dockerfile`.
- **Create workflows:** `npm-imports.yml`, `npm-minifuzz.yml`, `docker-perf.yml`,
  `npm-perf.yml`.
- **Rename/repurpose workflows** (git mv + edit to the new single-job +
  `provision-typeberry` shape):
  - `docker-conformance.yml` → `conformance.yml` (target=source)
  - `docker-test-vectors.yml` → `test-vectors.yml` (target=source)
  - `picofuzz.yml` → `docker-perf.yml` (target=docker); add `npm-perf.yml` (target=npm)
  - `minifuzz.yml` → `docker-minifuzz.yml` (target=docker); add `npm-minifuzz.yml` (target=npm)
- **Modify workflows:** `docker-works.yml`, `docker-imports.yml` (single-job +
  `provision-typeberry target=docker`); `npm-works.yml` (target=npm, default
  `version=next` — this absorbs `npm-next-works.yml`); `pr-benchmark.yml` (one line:
  tag the loaded artifact `typeberry:test` instead of
  `ghcr.io/fluffylabs/typeberry:latest`).
- **Remove:** `npm-next-works.yml` (folded into `npm-works.yml` + `version`).
- **Modify code/config:** `tests/common.ts` + the four `tests/docker-*.test.ts`
  (use `TYPEBERRY_IMAGE`, default `typeberry:test`). `package.json`: remove the
  `fetch-typeberry` script (provisioning now lives entirely in the composite
  action, which runs `docker pull`/`docker build` directly). `README.md`: update
  the Status badge set to the new per-(target × test) workflows.

## Open follow-ups (out of scope)

- Build caching to speed up the npm/source image builds.
- Whether `docker-perf` vs `npm-perf` should compare against the same baseline at
  `typeberry.fluffylabs.dev` or maintain separate baselines (both are containerized
  now, so a shared baseline is plausible — to be decided when wiring perf).
