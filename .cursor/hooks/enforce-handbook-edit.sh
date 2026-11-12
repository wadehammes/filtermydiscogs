#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write|StrReplace): block edits that violate handbook conventions on the resulting file.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  */src/* | src/* | */e2e/* | e2e/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

case "$file" in
  */node_modules/* | */.next/* | */src/tests/utils/handbookEditGuard.spec.ts | src/tests/utils/handbookEditGuard.spec.ts | */src/tests/utils/handbookTestRules.spec.ts | src/tests/utils/handbookTestRules.spec.ts | */scripts/cursor-handbook-guard.runner.spec.ts | scripts/cursor-handbook-guard.runner.spec.ts) exit 0 ;;
esac

root="$(project_dir)"
jest_output=""
guard_status=0

if ! run_pnpm --version >/dev/null 2>&1; then
  exit 0
fi

jest_output="$(
  cd "$root" &&
    CURSOR_HANDBOOK_GUARD_STDIN="$INPUT" run_pnpm exec jest scripts/cursor-handbook-guard.runner.spec.ts --runInBand 2>&1
)" || guard_status=$?

if [ "$guard_status" -eq 0 ]; then
  exit 0
fi

violations="$(printf '%s' "$jest_output" | awk '/^Error:/{flag=1; sub(/^Error: ?/,""); print; next} flag && /^$/{exit} flag{print}')"

if [ -z "$violations" ]; then
  violations="$(printf '%s' "$jest_output" | tail -20)"
fi

reason="$(printf 'Blocked handbook convention violation(s) in %s. Fix the issues below and retry.\n\n%s' "$file" "$violations")"
deny_tool "$reason"
