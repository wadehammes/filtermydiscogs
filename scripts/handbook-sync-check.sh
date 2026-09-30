#!/usr/bin/env bash
set -euo pipefail

# Fail when substantive code/infra changed vs base ref but no docs/handbook/*.md updated.
# Usage: bash scripts/handbook-sync-check.sh [base-ref]
# Default base: origin/staging

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_REF="${1:-origin/staging}"

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "handbook-sync-check: base ref '${BASE_REF}' not found (fetch remotes first)." >&2
  exit 1
fi

source "${ROOT}/.cursor/hooks/_lib.sh"

changed="$(git diff --name-only "${BASE_REF}"...HEAD 2>/dev/null || true)"

code_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$|^\.jest/|^jest\.config\.(ts|js|mjs)$|^e2e/.*\.(ts|tsx)$|^playwright\.config\.ts$|^next\.config\.(ts|js|mjs)$' || true)"
docs_changed="$(printf '%s\n' "$changed" | grep -E '^docs/handbook/.*\.md$' || true)"

if [ -z "$code_changed" ]; then
  exit 0
fi

if [ -n "$docs_changed" ]; then
  exit 0
fi

chapter_set=""
while IFS= read -r path; do
  [ -z "$path" ] && continue
  for chapter in $(handbook_chapters_for_path "$path"); do
    case " $chapter_set " in
      *" $chapter "*) ;;
      *) chapter_set="${chapter_set}${chapter} " ;;
    esac
  done
done <<EOF
$code_changed
EOF

suggested="$(printf '%s' "$chapter_set" | xargs | tr ' ' '\n' | sort -u | paste -sd ', ' -)"

cat >&2 <<EOF
handbook-sync-check failed: code or test infra changed vs ${BASE_REF} but no docs/handbook/*.md in the diff.

Update the handbook (route via docs/handbook/llms.md) or add docs/handbook/*.md in this PR.
Suggested chapter(s): ${suggested:-conventions.md, platform.md}

Changed paths:
${code_changed}
EOF

exit 1
