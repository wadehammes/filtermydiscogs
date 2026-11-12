#!/usr/bin/env bash
set -euo pipefail

# stop: one orchestrated follow-up per agent turn (loop_limit: 1 in hooks.json).
# Expensive lint/Jest and repeated drift nags are deduped per conversation fingerprint — see _lib.sh stop_notified_*.

source "$(dirname "$0")/_lib.sh"
source "$(dirname "$0")/_stop_checks.sh"

INPUT="$(cat)"

loop_count="$(hook_loop_count)"
if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(hook_cwd)"
[ -n "$root" ] && cd "$root"
STOP_ROOT="${root:-$(pwd)}"

changed="$(changed_files_worktree)"
fp="$(printf '%s\n' "$changed" | changed_files_content_fingerprint)"

sections=()

if ! stop_notified_for_fingerprint "handbook_drift" "$fp"; then
  drift_out="$(stop_section_handbook_drift "$changed" || true)"
  if [ -n "$drift_out" ]; then
    sections+=("$drift_out")
    stop_mark_notified "handbook_drift" "$fp"
  fi
fi

if ! stop_notified_for_fingerprint "terms_privacy" "$fp"; then
  terms_out="$(stop_section_terms_privacy "$changed" || true)"
  if [ -n "$terms_out" ]; then
    sections+=("$terms_out")
    stop_mark_notified "terms_privacy" "$fp"
  fi
fi

if ! stop_notified_for_fingerprint "prisma_generate" "$fp"; then
  prisma_out="$(stop_section_prisma_generate "$changed" || true)"
  if [ -n "$prisma_out" ]; then
    sections+=("$prisma_out")
    stop_mark_notified "prisma_generate" "$fp"
  fi
fi

lint_out="$(stop_section_lint_all "$changed" "$fp" || true)"
[ -n "$lint_out" ] && sections+=("$lint_out")

jest_out="$(stop_section_jest_changed "$changed" "$fp" || true)"
[ -n "$jest_out" ] && sections+=("$jest_out")

copy_out="$(stop_section_login_copy_jest "$changed" "$fp" || true)"
[ -n "$copy_out" ] && sections+=("$copy_out")

handbook_test_out="$(stop_section_handbook_test_jest "$changed" "$fp" || true)"
[ -n "$handbook_test_out" ] && sections+=("$handbook_test_out")

if [ "${#sections[@]}" -eq 0 ]; then
  exit 0
fi

reason="$(printf '%s\n\n' "${sections[@]}")"
reason="${reason%$'\n'}"
emit_followup "$reason"
