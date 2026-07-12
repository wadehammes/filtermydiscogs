#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): deny edits that add code comments.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\n' "$added" | grep -nE '^[[:space:]]*(//|/\*|\*)' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit adds code comments. Do not add explanatory comments — write self-documenting code (clear names, small functions) instead. Remove the comment lines and retry.\n\nOffending lines:\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
