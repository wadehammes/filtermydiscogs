#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

E2E_PORT=6767
# Keep in sync with LOGIN_DEMO_PUBLIC_CRATE_* in publicCrate.constants.ts
E2E_DEMO_CRATE_PATH="/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb"

assert_e2e_web_server_env() {
  if ! lsof -nP -iTCP:"${E2E_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi

  local body
  body="$(curl -fsS "http://127.0.0.1:${E2E_PORT}${E2E_DEMO_CRATE_PATH}" 2>/dev/null || true)"

  if printf '%s' "${body}" | grep -q "Page not found"; then
    cat <<'EOF' >&2

E2E preflight failed: something is already listening on port 6767 without
NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED=1. Demo public share routes render "Page not found".

Stop that process and re-run, or start dev with:
  NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED=1 pnpm dev -p 6767

See docs/handbook/platform.md (Playwright / public-crate E2E).
EOF
    exit 1
  fi
}

assert_e2e_web_server_env
bash "${ROOT}/scripts/ensure-playwright-chromium.sh"
exec pnpm exec playwright test "$@"
