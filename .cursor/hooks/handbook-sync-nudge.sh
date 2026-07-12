#!/usr/bin/env bash
set -euo pipefail

# postToolUse (Write|StrReplace): remind to update the matching handbook chapter.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

chapter=""
case "$file" in
  *.spec.ts | *.spec.tsx | *.test.ts | *.test.tsx)
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
  *)
    exit 0 ;;
esac

ctx="Handbook-sync check: you just edited $file. If this change shifts documented behavior or conventions, update docs/handbook/$chapter in the same change so the handbook stays accurate."

advise_context "$ctx"
exit 0
