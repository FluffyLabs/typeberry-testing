#!/bin/bash

set -e

# Get the script directory to ensure we're in the right place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building minifuzz Docker image..."
cd "$PROJECT_DIR"
docker build -f utils/minifuzz.Dockerfile -t minifuzz .

echo "Running minifuzz --help..."
docker run --rm minifuzz --help

echo "======================================"
echo " "
echo " Build finished. Run minifuzz using:"
echo " "
echo " $ docker run --rm minifuzz --help"
echo " "
echo "======================================"
