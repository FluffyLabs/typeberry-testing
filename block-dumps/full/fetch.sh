#!/bin/bash
# Fetches the full-chainspec block dump from the GitHub release asset.
# Skips the download when a checksum-valid copy is already present
# (acts as the cache on self-hosted CI runners).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

FILE=chain-100k.bin
ASSET_URL="https://github.com/FluffyLabs/typeberry-testing/releases/download/block-dumps-full-v1/${FILE}"

checksum_ok() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${FILE}.sha256"
  else
    shasum -a 256 -c "${FILE}.sha256"
  fi
}

if [ -f "$FILE" ] && checksum_ok; then
  echo "$FILE already present and checksum-valid."
  exit 0
fi

echo "Downloading $FILE..."
# Don't leave a partial file behind on download/verification failure.
trap 'rm -f "$FILE"' ERR
curl -fL --retry 3 -o "$FILE" "$ASSET_URL"
checksum_ok
