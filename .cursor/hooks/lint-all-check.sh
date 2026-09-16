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

changed="$( {
  git diff --name-only HEAD 2>/dev/null
  git diff --cached --name-only 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
} | sort -u)"

meaningful_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$|^prisma/|^package\.json$|^pnpm-lock\.yaml$|^next\.config\.(ts|js|mjs)$' || true)"

if [ -z "$meaningful_changed" ]; then
  exit 0
fi

if ! run_pnpm --version >/dev/null 2>&1; then
  reason="$(printf 'Lint check: meaningful source changes but pnpm is unavailable (install mise tools with `mise install`, then re-run). Manual check: mise exec -- pnpm lint:all\n\nChanged files:\n%s' "$meaningful_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

lint_output=""
lint_status=0
lint_output="$(run_pnpm lint:all 2>&1)" || lint_status=$?

if [ "$lint_status" -ne 0 ]; then
  reason="$(printf 'lint:all failed after substantive edits. Fix the issues below, then run `pnpm lint:all` again before finishing.\n\nChanged files:\n%s\n\nLint output:\n%s' "$meaningful_changed" "$lint_output")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
