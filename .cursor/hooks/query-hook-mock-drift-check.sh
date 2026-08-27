#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

feature_tests_changed="$(printf '%s\n' "$changed" | grep -E '\.(spec|po)\.(ts|tsx)$' || true)"

if [ -z "$feature_tests_changed" ]; then
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  reason="$(printf 'Query-hook mock drift check: feature test files changed but pnpm is unavailable. Run: pnpm jest src/tests/utils/queryHookMockRules.spec.ts\n\nChanged test files:\n%s' "$feature_tests_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

jest_output=""
jest_status=0
jest_output="$(pnpm jest src/tests/utils/queryHookMockRules.spec.ts --runInBand --no-cache 2>&1)" || jest_status=$?

if [ "$jest_status" -ne 0 ]; then
  reason="$(printf 'Query-hook mock drift check failed. Feature tests must mock src/api/helpers, not hooks under src/hooks/queries/. Rules: src/tests/utils/queryHookMockRules.ts. Handbook: docs/handbook/conventions.md (Do not test React Query).\n\nChanged test files:\n%s\n\nTest output:\n%s' "$feature_tests_changed" "$jest_output")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
