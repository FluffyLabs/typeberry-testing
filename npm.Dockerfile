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
