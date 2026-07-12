#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): steer new component creation through `pnpm scaffold`.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

[ -z "$file" ] && exit 0

if [[ ! "$file" =~ (^|/)src/components/([^/]+)/([^/]+)\.component\.tsx$ ]]; then
  exit 0
fi

folder="${BASH_REMATCH[2]}"
base="${BASH_REMATCH[3]}"

if [ "$base" != "$folder" ] || [[ ! "$folder" =~ ^[A-Z] ]]; then
  exit 0
fi

dir="$(dirname "$(abs_path "$file")")"

if [ -d "$dir" ]; then
  exit 0
fi

reason="Blocked: create new components with the scaffold, not by hand. Run \`pnpm scaffold ${folder}\` — it stubs the component, CSS module, interfaces, page object, and spec under src/components/${folder}/, plus a factory in src/tests/factories/, so the folder matches the documented layout. Then edit those files. See docs/handbook/components.md."

deny_tool "$reason"
exit 0
