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
corepack enable
yarn install

# Services (Docker configs + E2E tests)
echo ""
echo "--- Services (yarn + Playwright) ---"
cd "$REPO_ROOT/services"
corepack enable
yarn install
npx playwright install chromium

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy frontend/.env.template to frontend/.env.local (if not done)"
echo "  2. Start services: cd services && yarn services:start"
echo "  3. Start dev servers: ./dev.sh"
