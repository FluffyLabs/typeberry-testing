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
# Run as non-root (parity with npm.Dockerfile and the published image). The
# build steps above run as root; create the user with HOME=/app (no -m, the dir
# already exists) and hand it /app (sources, node_modules, npm/tsx cache under
# HOME, and ./database) so the test-runner can read code and write at runtime.
RUN useradd -d /app typeberry && chown -R typeberry:typeberry /app
USER typeberry
# Default entrypoint runs the jam node; the conformance / test-vectors suites
# that use this image override it with `--entrypoint /bin/bash` to invoke the
# `@typeberry/test-runner` workspace scripts.
ENTRYPOINT ["npm", "start", "--"]
