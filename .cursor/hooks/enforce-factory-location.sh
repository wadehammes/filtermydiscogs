#!/usr/bin/env bash
set -euo pipefail

# preToolUse (Write): factories must live in src/tests/factories/.

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  *.factory.ts) ;;
  *) exit 0 ;;
esac

case "$file" in
  */src/tests/factories/* | src/tests/factories/*) exit 0 ;;
esac

base="$(basename "$file")"
reason="Blocked: factories live in src/tests/factories/, not next to the component. Create this as src/tests/factories/${base} (subclass BaseFactory, export a singleton). Grouping factories in one folder keeps shared test data discoverable and avoids circular imports. See docs/handbook/factories.md."

deny_tool "$reason"
exit 0
