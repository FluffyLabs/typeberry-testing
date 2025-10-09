#!/usr/bin/env bash
set -eu

# Jump to workspace root.
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

echo "==> Installing dependencies..."
npm ci

echo "==> Building picofuzz..."
npm run build-docker -w @fluffylabs/picofuzz

echo "==> Preparing test cases..."
npm run prepare-data -w @fluffylabs/picofuzz

echo "==> Creating result directory..."
mkdir -p ./picofuzz-result
chmod 777 ./picofuzz-result

echo "✅ Setup complete!"
