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

copy_changed="$(printf '%s\n' "$changed" | grep -E '^src/constants/loginPageCopy\.registry\.ts$|^src/components/Login/loginFeatures\.constants\.ts$|^src/components/Login/Login\.component\.tsx$|^src/components/LoginBottomCta/LoginBottomCta\.component\.tsx$' || true)"

if [ -z "$copy_changed" ]; then
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  reason="$(printf 'Login page copy drift check: copy source files changed but pnpm is unavailable to run literary rule tests. Run: pnpm jest src/tests/utils/loginPageCopyLiteraryRules.spec.ts\n\nChanged copy files:\n%s' "$copy_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

jest_output=""
jest_status=0
jest_output="$(pnpm jest src/tests/utils/loginPageCopyLiteraryRules.spec.ts --runInBand --no-cache 2>&1)" || jest_status=$?

if [ "$jest_status" -ne 0 ]; then
  reason="$(printf 'Login page copy drift check failed literary rules. Update copy to remove em dashes, embellishment, and inaccurate claims. Registry: src/constants/loginPageCopy.registry.ts. Rules: src/tests/utils/loginPageCopyLiteraryRules.ts\n\nChanged copy files:\n%s\n\nTest output:\n%s' "$copy_changed" "$jest_output")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
