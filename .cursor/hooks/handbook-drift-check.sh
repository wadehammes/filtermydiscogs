#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed code under src/ but touched no handbook chapter,
# and/or changed product/setup surfaces without README.md, follow up once.
# loop_count prevents repeat loops.

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

sections=()

if [ "$needs_handbook" = true ]; then
  sections+=("$(printf 'Handbook: this session changed code under src/ but no docs/handbook/*.md. If any change shifted documented behavior or conventions, update the matching chapter now (see docs/handbook/llms.md). If nothing documented changed, say the handbook is still accurate.\n\nChanged code files:\n%s' "$code_changed")")
fi

if [ "$needs_readme" = true ]; then
  sections+=("$(printf 'README: this session changed product/setup surfaces but not README.md. If Features, Pages, Usage, Setup, or Tech Stack are now wrong or incomplete, update the root README. If the public README is still accurate, say so.\n\nREADME-relevant files:\n%s' "$readme_relevant")")
fi

reason="$(printf '%s\n\n' "${sections[@]}")"
jq -n --arg r "$reason" '{ followup_message: $r }'
exit 0
