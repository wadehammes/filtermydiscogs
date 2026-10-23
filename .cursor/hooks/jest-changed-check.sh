#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_lib.sh"

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"
ROOT="${root:-$(pwd)}"

changed="$( {
  git diff --name-only HEAD 2>/dev/null
  git diff --cached --name-only 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
} | sort -u)"

jest_relevant="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx)$|^\.jest/|^jest\.config\.(ts|js|mjs)$' || true)"

if [ -z "$jest_relevant" ]; then
  exit 0
fi

if ! run_pnpm --version >/dev/null 2>&1; then
  reason="$(printf 'Jest check: source/test files changed but pnpm is unavailable. Manual check: mise exec -- pnpm test:changed\n\nChanged files:\n%s' "$jest_relevant")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

if ! git rev-parse --verify origin/staging^{commit} >/dev/null 2>&1; then
  exit 0
fi

jest_output=""
jest_status=0
jest_output="$(JEST_CHANGED_INCLUDE_WORKTREE=1 bash "$ROOT/scripts/jest-changed.sh" origin/staging 2>&1)" || jest_status=$?

if [ "$jest_status" -ne 0 ]; then
  reason="$(printf 'Jest failed for changes in this session. Fix the failures below, then run `pnpm test:changed` (or `pnpm test:ci` before push).\n\nChanged files:\n%s\n\nJest output:\n%s' "$jest_relevant" "$jest_output")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
