#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
npm ci

echo "==> Building picofuzz..."
npm run build-docker -w @fluffylabs/picofuzz

echo "==> Creating result directory..."
mkdir -p ./picofuzz-result
chmod 777 ./picofuzz-result

echo "✅ Setup complete!"
