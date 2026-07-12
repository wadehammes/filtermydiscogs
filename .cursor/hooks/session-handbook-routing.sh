#!/usr/bin/env bash
set -euo pipefail

# sessionStart: inject handbook routing map once per composer session.

root="$(pwd)"
map_file="$root/docs/handbook/llms.md"

[ -f "$map_file" ] || exit 0

map_content="$(<"$map_file")"

jq -n --arg map "$map_content" '{
  additional_context: (
    "Handbook routing — read the chapter matching this task BEFORE editing code (from docs/handbook/llms.md):\n\n"
    + $map
  )
}'

exit 0
