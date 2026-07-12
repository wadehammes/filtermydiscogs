#!/usr/bin/env bash
set -euo pipefail

# postToolUse (Write|StrReplace): advisory when a CSS file nests selectors 4+ levels deep.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.css) ;;
  *) exit 0 ;;
esac

abs="$(abs_path "$file")"
[ -f "$abs" ] || exit 0

violations="$(awk '
  BEGIN { FS=""; sp=0; sd=0; buf=""; }
  {
    for (i=1; i<=NF; i++) {
      c = $i;
      if (c == "{") {
        t = buf; gsub(/^[ \t\r\n]+/, "", t); gsub(/[ \t\r\n]+$/, "", t);
        if (t ~ /^@/ || t == "") { typ = "at" } else { typ = "sel" }
        if (typ == "sel") { sd++; if (sd >= 5) { print NR ": " t } }
        sp++; st[sp] = typ; buf = "";
      } else if (c == "}") {
        if (sp >= 1) { if (st[sp] == "sel") sd--; sp-- }
        buf = "";
      } else if (c == ";") { buf = "" }
      else { buf = buf c }
    }
    buf = buf "\n";
  }
' "$abs" 2>/dev/null || true)"

[ -z "$violations" ] && exit 0

ctx="$(printf 'CSS nesting check: %s nests selectors 4+ levels deep. Up to 3 levels is fine; beyond that, break the deepest rules out to top-level using the full selector (e.g. `.table .tableCell {}` instead of nesting `.tableCell` further). See docs/handbook/conventions.md (CSS → Style rules).\n\nDeeply nested selectors:\n%s' "$file" "$violations")"

advise_context "$ctx"
exit 0
