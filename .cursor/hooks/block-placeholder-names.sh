#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): deny generic placeholder identifiers in TS/TSX.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

names='raw|tmp|temp|val|thing|foo|bar|stuff'

violations="$(printf '%s\n' "$added" | grep -nE \
  "(\b(const|let|var)[[:space:]]+($names)\b)|(\(($names)[[:space:]]*(:|,|\)))|(,[[:space:]]*($names)[[:space:]]*(:|,|\)))|(\b($names)[[:space:]]*=>)" \
  || true)"

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked: this edit names a const/let/var binding or a function parameter with a generic placeholder (one of: raw, tmp, temp, val, thing, foo, bar, stuff). Use a semantic name that describes what the value IS — its domain meaning, format, or source (e.g. encodedValue, cookieString, metadataEntry, apiResponse, candidateSlug, trimmedDescription). See docs/handbook/conventions.md (TypeScript → semantic parameter and variable names).\n\nOffending lines:\n%s' "$violations")"
  deny_tool "$reason"
fi

exit 0
