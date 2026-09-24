#!/usr/bin/env bash
set -euo pipefail

# sessionStart: one-line handbook pointer (full routing map stays in docs/handbook/llms.md).

root="$(pwd)"
map_file="$root/docs/handbook/llms.md"

[ -f "$map_file" ] || exit 0

jq -n '{
  additional_context: "Handbook source of truth: docs/handbook/ (route substantive work via docs/handbook/llms.md before editing). AGENTS.md and .cursor/rules/ align; no need to re-read the full map each turn."
}'

exit 0
