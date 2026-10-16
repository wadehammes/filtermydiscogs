#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${PLAYWRIGHT_SKIP_ENSURE_CHROMIUM:-}" = "1" ]; then
  exit 0
fi

if node "${ROOT}/scripts/ensure-playwright-chromium.mjs" check; then
  exit 0
fi

echo "" >&2
echo "Playwright Chromium is not installed for this @playwright/test version." >&2
echo "Downloading browsers (same as: pnpm test:e2e:install) …" >&2
echo "" >&2

pnpm exec playwright install chromium --no-progress
