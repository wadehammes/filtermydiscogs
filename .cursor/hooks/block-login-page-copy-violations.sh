#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_lib.sh"
hook_input

file="$(tool_file_path)"

case "$file" in
  */loginPageCopy.registry.ts \
    | */userFacingCopy.registry.ts \
    | */marketingPublicCopy.ts \
    | */supportProjectToast.constants.ts \
    | */about.constants.ts \
    | */donate.constants.ts \
    | */settingsCopy.constants.ts \
    | */dashboardCopy.constants.ts \
    | */cookieConsentCopy.constants.ts \
    | */sentryUserFeedbackForm.constants.ts \
    | */publicReleaseListen.constants.ts \
    | */playlistPlaybackCopy.constants.ts \
    | */loginFeatures.constants.ts \
    | */Login/Login.component.tsx \
    | */LoginBottomCta/LoginBottomCta.component.tsx \
    | */SupportProjectToast/supportProjectToast.tsx \
    | */About/AboutDonationSection.component.tsx \
    | */CookieConsentBanner/CookieConsentBanner.component.tsx \
    | */Settings/SettingsClient.component.tsx \
    | */Settings/SettingsSectionPanels.component.tsx \
    | */Dashboard/DuplicatesList.component.tsx \
    | */dashboardStory.ts) ;;
  *) exit 0 ;;
esac

added="$(tool_added_text)"

if [ -z "$added" ]; then
  exit 0
fi

violations=""

if printf '%s' "$added" | grep -q $'—'; then
  violations="${violations}Em dashes are not allowed in user-facing copy.\n"
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
  "hidden gems"
)

for term in "${embellishment_terms[@]}"; do
  if printf '%s' "$added_lower" | grep -Eiq "\\b${term// /[[:space:]]+}\\b"; then
    violations="${violations}Embellishment term is not allowed: \"${term}\".\n"
  fi
done

if [ -n "$violations" ]; then
  reason="$(printf 'Blocked user-facing copy violation in %s. Rules: src/tests/utils/loginPageCopyLiteraryRules.ts. Registry: src/constants/userFacingCopy.registry.ts.\n\n%s' "$file" "$violations")"
  deny_tool "$reason"
fi

exit 0
