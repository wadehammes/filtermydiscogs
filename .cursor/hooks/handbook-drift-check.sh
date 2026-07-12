#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed code under src/ but touched no handbook chapter,
# follow up once to prompt a handbook check. loop_count prevents repeat loops.

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

code_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$' || true)"
docs_changed="$(printf '%s\n' "$changed" | grep -E '^docs/handbook/.*\.md$' || true)"

if [ -n "$code_changed" ] && [ -z "$docs_changed" ]; then
  reason="$(printf 'Handbook-drift check: this session changed code under src/ but no docs/handbook/*.md. If any change shifted documented behavior or conventions, update the matching chapter now (see docs/handbook/llms.md for routing). If nothing documented changed, reply that the handbook is still accurate.\n\nChanged code files:\n%s' "$code_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
