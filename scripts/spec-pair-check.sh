#!/usr/bin/env bash
set -euo pipefail

# Fail when gated production files change vs base ref without a paired spec in the same diff.
# Usage: bash scripts/spec-pair-check.sh [base-ref]
# Default base: origin/staging

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_REF="${1:-origin/staging}"

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "spec-pair-check: base ref '${BASE_REF}' not found (fetch remotes first)." >&2
  exit 1
fi

changed="$(git diff --name-only "${BASE_REF}"...HEAD 2>/dev/null || true)"

if [ -z "$changed" ]; then
  exit 0
fi

changed_has() {
  printf '%s\n' "$changed" | grep -Fxq "$1"
}

# Playback-related utils that must gain a colocated spec when touched (even if none exists yet).
is_playback_gated_util() {
  case "$1" in
    src/utils/releasePlayback* | src/utils/playback* | src/utils/trackStatsQueryCache.ts | src/utils/trackPlaybackYoutube.ts | src/utils/resolveQueueItemEmbedTracksVideos.ts | src/utils/syncPlaybackSessionRefs.ts)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

util_alternate_specs() {
  case "$1" in
    src/utils/releasePlaybackEmbedConfirm.ts)
      printf '%s\n' src/utils/playbackEmbedSession.spec.ts
      ;;
  esac
}

list_release_playback_context_specs() {
  local f base
  for f in "$ROOT"/src/context/releasePlayback.context.*.spec.tsx; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    case "$base" in
      releasePlayback.context.spec.harness.tsx) continue ;;
    esac
    printf '%s\n' "src/context/${base}"
  done
}

hook_alternate_specs() {
  case "$1" in
    src/hooks/useReleasePlaybackProvider.hook.ts)
      list_release_playback_context_specs
      printf '%s\n' \
        src/utils/playbackEmbedSession.spec.ts \
        src/utils/applyPlaybackEmbedSessionEvent.spec.ts \
        src/utils/syncPlaybackEmbedSessionRefs.spec.ts \
        src/utils/trackStatsQueryCache.spec.ts \
        src/utils/releasePlaybackActivePresentation.spec.ts \
        src/utils/releasePlaybackEmbedConfirm.spec.ts \
        src/utils/embedPlaybackInfoDeliveryConfirm.spec.ts
      ;;
  esac
}

hook_spec_candidates() {
  local hook="$1"
  local dir base
  dir="$(dirname "$hook")"
  base="$(basename "$hook" .hook.ts)"

  printf '%s\n' \
    "${dir}/${base}.hook.spec.ts" \
    "${dir}/${base}.hook.spec.tsx" \
    "${dir}/${base}.spec.ts" \
    "${dir}/${base}.spec.tsx"
}

collect_satisfying_specs() {
  local prod="$1"
  local candidate

  case "$prod" in
    src/utils/*.ts)
      candidate="${prod%.ts}.spec.ts"
      if [ -f "$ROOT/$candidate" ]; then
        printf '%s\n' "$candidate"
      elif is_playback_gated_util "$prod"; then
        printf '%s\n' "$candidate"
      fi

      while IFS= read -r candidate; do
        [ -n "$candidate" ] || continue
        printf '%s\n' "$candidate"
      done < <(util_alternate_specs "$prod")
      ;;
    src/hooks/*.hook.ts)
      while IFS= read -r candidate; do
        [ -n "$candidate" ] || continue
        if [ -f "$ROOT/$candidate" ]; then
          printf '%s\n' "$candidate"
        fi
      done < <(hook_spec_candidates "$prod")

      while IFS= read -r candidate; do
        [ -n "$candidate" ] || continue
        printf '%s\n' "$candidate"
      done < <(hook_alternate_specs "$prod")
      ;;
    src/context/releasePlayback.context.tsx)
      list_release_playback_context_specs
      ;;
  esac
}

production_touched=()

while IFS= read -r path; do
  [ -z "$path" ] && continue
  case "$path" in
    *.spec.ts | *.spec.tsx) continue ;;
    src/utils/*.ts)
      if [[ "$path" == *.types.ts ]]; then
        continue
      fi
      production_touched+=("$path")
      ;;
    src/hooks/*.hook.ts) production_touched+=("$path") ;;
    src/context/releasePlayback.context.tsx) production_touched+=("$path") ;;
  esac
done <<EOF
$changed
EOF

if [ "${#production_touched[@]}" -eq 0 ]; then
  exit 0
fi

failures=""

for prod in "${production_touched[@]}"; do
  spec_list="$(collect_satisfying_specs "$prod" | sort -u)"
  if [ -z "$spec_list" ]; then
    continue
  fi

  satisfied=false
  while IFS= read -r spec; do
    [ -z "$spec" ] && continue
    if changed_has "$spec"; then
      satisfied=true
      break
    fi
  done <<EOF
$spec_list
EOF

  if [ "$satisfied" = false ]; then
    failures="${failures}
  ${prod}
    update one of: $(printf '%s' "$spec_list" | paste -sd ', ' -)"
  fi
done

if [ -z "$failures" ]; then
  exit 0
fi

cat >&2 <<EOF
spec-pair-check failed: production changes vs ${BASE_REF} without a paired spec in this diff.

TDD: add or extend a spec in the same PR before merge (see docs/handbook/conventions.md → Test-driven development).

Missing pairs:${failures}

Changed paths in diff:
${changed}
EOF

exit 1
