#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): deny margin-top in CSS.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\n' "$added" \
  | grep -nE 'margin-top[[:space:]]*:' \
  | grep -v 'scroll-margin-top' \
  | grep -vE 'margin-top[[:space:]]*:[[:space:]]*0[a-z%]*[[:space:]]*;?' \
  || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds margin-top. Do not use margin-top for spacing — put siblings in a flex container and use gap (e.g. display: flex; flex-direction: column; gap: var(--sizing-1)). See docs/handbook/conventions.md (CSS → Style rules).\n\nOffending lines:\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
