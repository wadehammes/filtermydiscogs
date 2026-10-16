#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "${ROOT}/scripts/ensure-playwright-chromium.sh"
exec pnpm exec playwright test "$@"
