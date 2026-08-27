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
  */src/hooks/queries/* | src/hooks/queries/*) exit 0 ;;
  */src/tests/utils/queryHookMockRules.spec.ts | src/tests/utils/queryHookMockRules.spec.ts) exit 0 ;;
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
  reason="$(printf 'Blocked query-hook mock in %s. Feature tests must mock src/api/urls, not React Query hooks under src/hooks/queries/. See docs/handbook/conventions.md (Do not test React Query).\n\n%s' "$file" "$violations")"
  deny_tool "$reason"
fi

exit 0
