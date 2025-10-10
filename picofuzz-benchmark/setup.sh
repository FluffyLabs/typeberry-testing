#!/usr/bin/env bash
set -eu

# Jump to workspace root.
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

# for some reason it's not available sometimes
echo "Make sure tsx is installed"
npm i tsx

echo "==> Building picofuzz..."
npm run build-docker -w @fluffylabs/picofuzz

echo "==> Creating result directory..."
mkdir -p ./picofuzz-result
chmod 777 ./picofuzz-result

echo "✅ Setup complete!"
