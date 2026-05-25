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
