#!/usr/bin/env bash
set -euo pipefail

# postToolUse (Write|StrReplace): remind to update the matching handbook chapter
# and/or root README when the edit touches product or setup surfaces.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

chapter=""
case "$file" in
  *.spec.ts | *.spec.tsx)
    chapter="conventions.md#testing (page objects, specs, screen queries)" ;;
  *.module.css)
    chapter="conventions.md (CSS Modules: mobile-first base + nested @media)" ;;
  */src/app/api/* | src/app/api/*)
    chapter="database.md or patterns.md (API routes, auth, cache headers)" ;;
  */src/app/* | src/app/*)
    chapter="patterns.md (App Router pages, metadata, layouts)" ;;
  */src/components/* | src/components/*)
    chapter="components.md (folder layout, scaffold, exports)" ;;
  */src/hooks/* | src/hooks/* | */src/context/* | src/context/* | */src/atoms/* | src/atoms/*)
    chapter="patterns.md (hooks, contexts, atoms, React Query)" ;;
  */src/lib/* | src/lib/* | */prisma/* | prisma/*)
    chapter="database.md (Prisma, db helpers, crate routes)" ;;
esac

readme=""
case "$file" in
  */src/app/page.tsx | src/app/page.tsx | */src/app/*/page.tsx | src/app/*/page.tsx)
    readme="README.md (Pages / Features / Usage)" ;;
  */src/components/Login/* | src/components/Login/* | \
  */loginFeatures.constants.ts | */loginPageCopy.registry.ts | */loginPageCopyLiteraryRules.ts)
    readme="README.md (Features — keep landing claims aligned)" ;;
  */mise.toml | mise.toml | */.tool-versions | .tool-versions)
    readme="README.md (Setup / Prerequisites / Development)" ;;
  */package.json | package.json)
    readme="README.md (Tech Stack / Development) if scripts or user-facing deps changed" ;;
  */docs/handbook/platform.md | docs/handbook/platform.md)
    readme="README.md (Setup / env) if setup steps or env vars users need changed" ;;
esac

if [ -z "$chapter" ] && [ -z "$readme" ]; then
  exit 0
fi

parts=()
if [ -n "$chapter" ]; then
  parts+=("If this change shifts documented behavior or conventions, update docs/handbook/$chapter in the same change.")
fi
if [ -n "$readme" ]; then
  parts+=("If this change shifts user-facing features, routes, setup, or tech stack listed in the root README, update $readme so newcomers are not misled.")
fi

ctx="Docs-sync check: you just edited $file. ${parts[*]}"

advise_context "$ctx"
exit 0
