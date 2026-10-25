#!/usr/bin/env bash
set -euo pipefail

# Run Jest for files changed vs base ref (production → --findRelatedTests; specs → direct).
# Usage: bash scripts/jest-changed.sh [base-ref] [--worktree]
# Default base: origin/staging
# --worktree: include uncommitted/cached edits (local/agent runs; CI uses committed diff only).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_REF="${1:-origin/staging}"
INCLUDE_WORKTREE=0

if [ "${2:-}" = "--worktree" ]; then
  INCLUDE_WORKTREE=1
fi

if [ "${JEST_CHANGED_INCLUDE_WORKTREE:-}" = "1" ]; then
  INCLUDE_WORKTREE=1
fi

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "jest-changed: base ref '${BASE_REF}' not found (fetch remotes first)." >&2
  exit 1
fi

changed="$(git diff --name-only "${BASE_REF}"...HEAD 2>/dev/null || true)"

if [ "$INCLUDE_WORKTREE" = "1" ]; then
  worktree_changed="$(
    {
      git diff --name-only HEAD 2>/dev/null || true
      git diff --name-only --cached HEAD 2>/dev/null || true
    } | grep -v '^$' || true
  )"
  if [ -n "$worktree_changed" ]; then
    changed="$(printf '%s\n%s' "$changed" "$worktree_changed" | grep -v '^$' | sort -u || true)"
  fi
fi

if [ -z "$changed" ]; then
  exit 0
fi

is_src_ts_file() {
  case "$1" in
    src/*.ts | src/*.tsx) return 0 ;;
    *) return 1 ;;
  esac
}

jest_targets=()
find_related=()

while IFS= read -r path; do
  [ -z "$path" ] && continue
  case "$path" in
    .jest/* | jest.config.ts | jest.config.js | jest.config.mjs)
      echo "jest-changed: test infra changed — running full pnpm test:ci" >&2
      pnpm test:ci
      exit $?
      ;;
  esac

  if [[ "$path" == *.spec.ts || "$path" == *.spec.tsx ]]; then
    if [ -f "$ROOT/$path" ]; then
      jest_targets+=("$path")
    fi
    continue
  fi

  if is_src_ts_file "$path"; then
    if [ ! -f "$ROOT/$path" ]; then
      continue
    fi
    if [[ "$path" == *.types.ts ]]; then
      continue
    fi
    find_related+=("$path")
  fi
done <<EOF
$changed
EOF

if [ "${#jest_targets[@]}" -eq 0 ] && [ "${#find_related[@]}" -eq 0 ]; then
  exit 0
fi

jest_args=(--runInBand --detectOpenHandles --passWithNoTests)

if [ "${#jest_targets[@]}" -gt 0 ]; then
  jest_args+=("${jest_targets[@]}")
fi

if [ "${#find_related[@]}" -gt 0 ]; then
  jest_args+=(--findRelatedTests "${find_related[@]}")
fi

pnpm test:scripts
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" \
  pnpm exec jest "${jest_args[@]}"
