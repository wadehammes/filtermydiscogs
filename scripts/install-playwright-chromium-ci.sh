#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENSURE=(node "${ROOT}/scripts/ensure-playwright-chromium.mjs" check)

if "${ENSURE[@]}"; then
  echo "Playwright Chromium already present; skipping playwright install (CI cache hit)."
  exit 0
fi

echo "Playwright Chromium missing; installing browser binaries (no apt)."
pnpm exec playwright install chromium --no-progress

if ! "${ENSURE[@]}"; then
  echo "Browser tree still incomplete; retrying playwright install chromium --force."
  pnpm exec playwright install chromium --no-progress --force
fi

if "${ENSURE[@]}"; then
  echo "Playwright Chromium ready."
  if [[ "${PLAYWRIGHT_CI_INSTALL_DEPS:-}" == "1" ]]; then
    echo "PLAYWRIGHT_CI_INSTALL_DEPS=1 — installing OS packages for Chromium."
    pnpm exec playwright install-deps chromium
  else
    echo "Skipping install-deps (GitHub ubuntu-24.04 images include Chromium libs; avoids apt/DNS flakes on newer runners)."
  fi
  exit 0
fi

echo "Playwright Chromium install incomplete after install --force." >&2
exit 1
