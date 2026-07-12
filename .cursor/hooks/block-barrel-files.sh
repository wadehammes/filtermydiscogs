#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): deny barrel files under src/.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

[ -z "$file" ] && exit 0

if [[ ! "$file" =~ (^|/)src/(.*/)?index\.tsx?$ ]]; then
  exit 0
fi

reason="Blocked: no barrel files. Do not add index.ts/index.tsx that re-exports from other modules — import directly from the defining module (e.g. \`from \"src/components/PlanCard/PlanCard.component\"\`). App Router route files use page.tsx/layout.tsx, not index barrels. See docs/handbook/conventions.md."

deny_tool "$reason"
exit 0
