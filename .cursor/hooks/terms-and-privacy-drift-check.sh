#!/usr/bin/env bash
set -euo pipefail

# stop: if the session changed storage / data-management code but not About or Legal
# copy, follow up once to prompt a terms-and-privacy check. loop_count prevents repeats.

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null || true)"

policy_changed="$(printf '%s\n' "$changed" | grep -E '^src/utils/(clearClientStoredData|filterPersistence|filtersStorage|releasePlaybackStorage|playbackVideoIntroStorage)\.ts$|^src/hooks/useClearAllUserData\.hook\.ts$|^src/constants/storageKeys\.ts$|^src/types/userPreferences\.types\.ts$|^src/lib/user-preferences\.server\.ts$|^prisma/schema\.prisma$|^src/app/api/auth/clear-data/|^src/app/api/user/preferences/|^src/components/Settings/' || true)"

policy_pages_changed="$(printf '%s\n' "$changed" | grep -E '^src/components/(About/AboutClient\.component|Legal/Legal(PageContent\.server|DataManagementActions\.client))\.tsx$' || true)"

if [ -n "$policy_changed" ] && [ -z "$policy_pages_changed" ]; then
  reason="$(printf 'Terms-and-privacy drift check: this session changed storage or data-management code but not About or Legal copy. If the change affects what we store, what Clear All Data removes, or how preferences sync, update src/components/About/AboutClient.component.tsx and src/components/Legal/LegalPageContent.server.tsx (and Settings confirm copy if relevant). If user-facing policy is unchanged, reply that About/Legal are still accurate.\n\nChanged policy-relevant files:\n%s' "$policy_changed")"
  jq -n --arg r "$reason" '{ followup_message: $r }'
  exit 0
fi

exit 0
