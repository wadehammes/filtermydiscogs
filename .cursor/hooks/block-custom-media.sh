#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): deny @custom-media in CSS.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

violations="$(printf '%s\n' "$added" | grep -nE '@custom-media|@media[[:space:]]*\(--' || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit uses @custom-media (or an @media (--var) reference), which is unreliable here. Use range-syntax media queries instead, e.g. @media (width >= 800px) or @media (width >= 1120px). See docs/handbook/conventions.md (CSS).\n\nOffending lines:\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
