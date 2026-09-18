#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.spec.ts | *.spec.tsx | *.po.tsx) ;;
  *) exit 0 ;;
esac

case "$file" in
  */src/tests/utils/handbookTestRules.spec.ts | src/tests/utils/handbookTestRules.spec.ts) exit 0 ;;
esac

case "$file" in
  */src/hooks/mutations/*.spec.ts | src/hooks/mutations/*.spec.ts \
  | */src/hooks/mutations/*.spec.tsx | src/hooks/mutations/*.spec.tsx \
  | */src/hooks/mutations/*.po.tsx | src/hooks/mutations/*.po.tsx \
  | */src/hooks/queries/*.spec.ts | src/hooks/queries/*.spec.ts \
  | */src/hooks/queries/*.spec.tsx | src/hooks/queries/*.spec.tsx \
  | */src/hooks/queries/*.po.tsx | src/hooks/queries/*.po.tsx)
    reason="Blocked: do not add specs under src/hooks/queries/ or src/hooks/mutations/. Cover writes at components, feature hooks, or contexts with mocked api.* — not mutation/query hook specs. See docs/handbook/conventions.md (Do not test React Query)."
    deny_tool "$reason"
    ;;
esac

added="$(tool_added_text)"

if [ -z "$added" ]; then
  exit 0
fi

violations=""

if printf '%s' "$added" | grep -qE 'jest\.mock\("src/hooks/queries/' \
  || printf '%s' "$added" | grep -qE "jest\.mock\('src/hooks/queries/"; then
  violations="${violations}Added jest.mock on src/hooks/queries/* — mock src/api/urls instead and let the real query hook run in TestProviders.\n"
fi

if printf '%s' "$added" | grep -qE 'jest\.mock\("src/hooks/mutations/' \
  || printf '%s' "$added" | grep -qE "jest\.mock\('src/hooks/mutations/"; then
  violations="${violations}Added jest.mock on src/hooks/mutations/* — mock src/api/urls and test outcomes at the call site instead.\n"
fi

if printf '%s' "$added" | grep -q 'setupDiscogsReleaseQueryMock'; then
  violations="${violations}Added setupDiscogsReleaseQueryMock — use setupFetchDiscogsReleaseMock to stub api.discogsRelease instead.\n"
fi

if printf '%s' "$added" | grep -qE 'from "src/hooks/queries/use' \
  && printf '%s' "$added" | grep -qE 'jest\.mocked\([[:space:]]*use[A-Z][a-zA-Z0-9]*Query[[:space:]]*\)'; then
  violations="${violations}Added jest.mocked() on a query hook from src/hooks/queries/ — mock src/api/urls instead.\n"
fi

if printf '%s' "$added" | grep -qE "from 'src/hooks/queries/use" \
  && printf '%s' "$added" | grep -qE 'jest\.mocked\([[:space:]]*use[A-Z][a-zA-Z0-9]*Query[[:space:]]*\)'; then
  violations="${violations}Added jest.mocked() on a query hook from src/hooks/queries/ — mock src/api/urls instead.\n"
fi

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked handbook testing violation in %s. Feature tests must mock src/api/urls — not query/mutation hooks under src/hooks/queries/ or src/hooks/mutations/, and no specs in those folders. See docs/handbook/conventions.md (Do not test React Query).\n\n%s' "$file" "$violations")"
  deny_tool "$reason"
fi

exit 0
