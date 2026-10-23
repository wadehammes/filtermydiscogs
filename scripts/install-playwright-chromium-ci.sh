#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if node "${ROOT}/scripts/ensure-playwright-chromium.mjs" check; then
  echo "Playwright Chromium already present; skipping OS dependency install (--with-deps)."
  pnpm exec playwright install chromium --no-progress
  exit 0
fi

echo "Playwright Chromium missing; installing browsers and OS dependencies (--with-deps)."
pnpm exec playwright install chromium --with-deps --no-progress
