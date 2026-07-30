#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  */loginPageCopy.registry.ts | */loginFeatures.constants.ts | */Login/Login.component.tsx | */LoginBottomCta/LoginBottomCta.component.tsx) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

if [ -z "$added" ]; then
  exit 0
fi

violations=""

if printf '%s' "$added" | grep -q $'—'; then
  violations="${violations}Em dashes are not allowed in login page copy.\n"
fi

banned_phrases=(
  "notes visible on public"
  "with your notes visible"
  "on public crate pages when"
  "shown on public crate pages"
  "public crate pages when shareable"
  "notes appear on public"
  "your notes visible on the page"
)

added_lower="$(printf '%s' "$added" | tr '[:upper:]' '[:lower:]')"

for phrase in "${banned_phrases[@]}"; do
  if printf '%s' "$added_lower" | grep -Fq "$phrase"; then
    violations="${violations}Banned inaccurate phrase: \"${phrase}\".\n"
  fi
done

embellishment_terms=(
  "celebrate"
  "beautifully"
  "beautiful visualizations"
  "passion project"
  "game-changer"
  "game changer"
  "unlock"
  "effortlessly"
  "seamlessly"
  "stunning"
  "gorgeous"
  "transformative"
  "revolutionary"
)

for term in "${embellishment_terms[@]}"; do
  if printf '%s' "$added_lower" | grep -Eiq "\\b${term// /[[:space:]]+}\\b"; then
    violations="${violations}Embellishment term is not allowed: \"${term}\".\n"
  fi
done

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked login page copy violation in %s. Rules live in src/tests/utils/loginPageCopyLiteraryRules.ts and src/constants/loginPageCopy.registry.ts. Fix the added text and retry.\n\n%s' "$file" "$violations")"
  deny_tool "$reason"
fi

exit 0
