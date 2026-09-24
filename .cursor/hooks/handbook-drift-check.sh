#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed code under src/ but touched no handbook chapter,
# and/or changed product/setup surfaces without README.md, follow up once.
# loop_count prevents repeat loops.

source "$(dirname "$0")/_lib.sh"

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

code_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$' || true)"
docs_changed="$(printf '%s\n' "$changed" | grep -E '^docs/handbook/.*\.md$' || true)"

readme_relevant="$(printf '%s\n' "$changed" | grep -E '^src/app(/.*)?/page\.tsx$|^src/components/Login/|^src/constants/loginPageCopy\.registry\.ts$|^src/components/Login/loginFeatures\.constants\.ts$|^src/tests/utils/loginPageCopyLiteraryRules\.ts$|^mise\.toml$|^\.tool-versions$|^package\.json$|^docs/handbook/platform\.md$' || true)"
readme_changed="$(printf '%s\n' "$changed" | grep -E '^README\.md$' || true)"

needs_handbook=false
needs_readme=false

if [ -n "$code_changed" ] && [ -z "$docs_changed" ]; then
  needs_handbook=true
fi

if [ -n "$readme_relevant" ] && [ -z "$readme_changed" ]; then
  needs_readme=true
fi

if [ "$needs_handbook" = false ] && [ "$needs_readme" = false ]; then
  exit 0
fi

suggested_chapters=""
if [ "$needs_handbook" = true ]; then
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
  suggested_chapters="$(printf '%s' "$chapter_set" | xargs | tr ' ' '\n' | sort -u | paste -sd ', ' -)"
fi

sections=()

if [ "$needs_handbook" = true ]; then
  sections+=("$(printf '%s\n' \
    'Post-work handbook sync (required before you finish):' \
    '' \
    '1. Route via docs/handbook/llms.md — read the rows that match this work.' \
    "2. Update the suggested chapter(s) if behavior, file locations, or test conventions shifted: ${suggested_chapters:-see llms.md}." \
    '3. If nothing in those chapters was wrong, say so explicitly — name the section headings you verified (do not reply “handbook still accurate” without that list).' \
    '4. Same PR or immediate follow-up; do not leave docs stale.' \
    '' \
    'Changed code files:' \
    "$code_changed")")
fi

if [ "$needs_readme" = true ]; then
  sections+=("$(printf 'README: this session changed product/setup surfaces but not README.md. If Features, Pages, Usage, Setup, or Tech Stack are now wrong or incomplete, update the root README. If the public README is still accurate, say so explicitly.\n\nREADME-relevant files:\n%s' "$readme_relevant")")
fi

reason="$(printf '%s\n\n' "${sections[@]}")"
jq -n --arg r "$reason" '{ followup_message: $r }'
exit 0
