#!/bin/bash

set -euo pipefail

# Lasius project installation / bootstrap
# Run this after cloning or when dependencies change

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Lasius Installation ==="

# Backend
echo ""
echo "--- Backend (sbt) ---"
cd "$REPO_ROOT/backend"
sbt compile

# Frontend
echo ""
echo "--- Frontend (yarn) ---"
cd "$REPO_ROOT/frontend"
yarn install

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy frontend/.env.local.example to frontend/.env.local (if not done)"
echo "  2. Start services: cd services && yarn start"
echo "  3. Start dev servers: ./dev.sh"
echo "  Or start everything: ./dev.sh --docker"
