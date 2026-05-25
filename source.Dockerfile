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
