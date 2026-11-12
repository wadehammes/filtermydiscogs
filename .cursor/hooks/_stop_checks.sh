#!/usr/bin/env bash
# Shared stop-hook checks (sourced by session-stop-checks.sh and legacy *.sh scripts).

stop_section_handbook_drift() {
  local changed="$1"
  local code_changed docs_changed readme_relevant readme_changed
  local needs_handbook=false needs_readme=false spec_pair_message=""
  local suggested_chapters chapter_set path chapter

  code_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$|^\.jest/|^jest\.config\.(ts|js|mjs)$|^e2e/.*\.(ts|tsx)$|^playwright\.config\.ts$|^next\.config\.(ts|js|mjs)$' || true)"
  docs_changed="$(printf '%s\n' "$changed" | grep -E '^docs/handbook/.*\.md$' || true)"
  # Public README surfaces only — not docs/handbook/platform.md (agent/CI detail; handbook drift is separate).
  readme_relevant="$(printf '%s\n' "$changed" | grep -E '^src/app(/.*)?/page\.tsx$|^src/components/Login/|^src/constants/loginPageCopy\.registry\.ts$|^src/components/Login/loginFeatures\.constants\.ts$|^src/tests/utils/loginPageCopyLiteraryRules\.ts$|^mise\.toml$|^\.tool-versions$|^package\.json$' || true)"
  readme_changed="$(printf '%s\n' "$changed" | grep -E '^README\.md$' || true)"

  if [ -n "$code_changed" ] && [ -z "$docs_changed" ]; then
    needs_handbook=true
  fi
  if [ -n "$readme_relevant" ] && [ -z "$readme_changed" ]; then
    needs_readme=true
  fi

  if [ -n "$code_changed" ] && git rev-parse --verify origin/staging^{commit} >/dev/null 2>&1; then
    local spec_pair_err
    spec_pair_err="$(mktemp)"
    if ! SPEC_PAIR_INCLUDE_WORKTREE=1 bash "$STOP_ROOT/scripts/spec-pair-check.sh" origin/staging >"$spec_pair_err" 2>&1; then
      spec_pair_message="$(cat "$spec_pair_err")"
    fi
    rm -f "$spec_pair_err"
  fi

  if [ "$needs_handbook" = false ] && [ "$needs_readme" = false ] && [ -z "$spec_pair_message" ]; then
    return 0
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

  if [ -n "$spec_pair_message" ]; then
    printf '%s\n\n' "$(printf '%s\n' \
      'Spec pairing (TDD): fix before push — same gate as CI (scripts/spec-pair-check.sh origin/staging).' \
      'Run locally: pnpm handbook:check  or  SPEC_PAIR_INCLUDE_WORKTREE=1 bash scripts/spec-pair-check.sh origin/staging' \
      '' \
      "$spec_pair_message")"
  fi

  if [ "$needs_handbook" = true ]; then
    printf '%s\n\n' "$(printf '%s\n' \
      'Post-work handbook sync (required before you finish):' \
      '' \
      '1. Route via docs/handbook/llms.md — read the rows that match this work.' \
      "2. Update the suggested chapter(s) if behavior, file locations, or test conventions shifted: ${suggested_chapters:-see llms.md}." \
      '3. If nothing in those chapters was wrong, say so explicitly — name the section headings you verified (do not reply “handbook still accurate” without that list).' \
      '4. Same PR or immediate follow-up; do not leave docs stale.' \
      '' \
      'Changed code files:' \
      "$code_changed")"
  fi

  if [ "$needs_readme" = true ]; then
    printf '%s\n\n' "$(printf 'README: this session changed product/setup surfaces but not README.md. If Features, Pages, Usage, Setup, or Tech Stack are now wrong or incomplete, update the root README. If the public README is still accurate, say so explicitly.\n\nREADME-relevant files:\n%s' "$readme_relevant")"
  fi
}

stop_section_terms_privacy() {
  local changed="$1"
  local policy_changed policy_pages_changed

  policy_changed="$(printf '%s\n' "$changed" | grep -E '^src/utils/(clearClientStoredData|filterPersistence|filtersStorage|releasePlaybackStorage|playbackVideoIntroStorage)\.ts$|^src/hooks/useClearAllUserData\.hook\.ts$|^src/constants/storageKeys\.ts$|^src/types/userPreferences\.types\.ts$|^src/lib/user-preferences\.server\.ts$|^prisma/schema\.prisma$|^src/app/api/auth/clear-data/|^src/app/api/user/preferences/|^src/components/Settings/' || true)"
  policy_pages_changed="$(printf '%s\n' "$changed" | grep -E '^src/components/(About/AboutClient\.component|Legal/Legal(PageContent\.server|DataManagementActions\.client))\.tsx$' || true)"

  if [ -n "$policy_changed" ] && [ -z "$policy_pages_changed" ]; then
    printf '%s\n\n' "$(printf 'Terms-and-privacy drift check: this session changed storage or data-management code but not About or Legal copy. If the change affects what we store, what Clear All Data removes, or how preferences sync, update src/components/About/AboutClient.component.tsx and src/components/Legal/LegalPageContent.server.tsx (and Settings confirm copy if relevant). If user-facing policy is unchanged, reply that About/Legal are still accurate.\n\nChanged policy-relevant files:\n%s' "$policy_changed")"
  fi
}

stop_section_prisma_generate() {
  local changed="$1"
  local schema_changed

  schema_changed="$(printf '%s\n' "$changed" | grep -E '^prisma/schema\.prisma$' || true)"
  [ -z "$schema_changed" ] && return 0

  printf '%s\n\n' "$(cat <<'EOF'
Prisma schema changed this session. Run `pnpm db:generate` (or `mise exec -- pnpm db:generate`) so `@prisma/client` matches the schema before `pnpm tsc:ci` or dev. Commit generated client updates if your workflow expects them after migrate.
EOF
)"
}

stop_section_lint_all() {
  local changed="$1" fp="$2"
  local meaningful_changed lint_output lint_status

  if stop_notified_for_fingerprint "lint_all" "$fp"; then
    return 0
  fi

  meaningful_changed="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx|css)$|^\.jest/|^jest\.config\.(ts|js|mjs)$|^e2e/.*\.(ts|tsx)$|^playwright\.config\.ts$|^prisma/|^package\.json$|^pnpm-lock\.yaml$|^next\.config\.(ts|js|mjs)$' || true)"
  [ -z "$meaningful_changed" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "lint_all" "$fp"
    printf '%s\n\n' "$(printf 'Lint check: meaningful source changes but pnpm is unavailable (install mise tools with `mise install`, then re-run). Manual check: mise exec -- pnpm lint:all\n\nChanged files:\n%s' "$meaningful_changed")"
    return 0
  fi

  lint_output=""
  lint_status=0
  lint_output="$(run_pnpm lint:all 2>&1)" || lint_status=$?

  if [ "$lint_status" -ne 0 ]; then
    stop_mark_notified "lint_all" "$fp"
    printf '%s\n\n' "$(printf 'lint:all failed after substantive edits. Fix the issues below, then run `pnpm lint:all` again before finishing.\n\nChanged files:\n%s\n\nLint output:\n%s' "$meaningful_changed" "$lint_output")"
    return 0
  fi

  stop_clear_notified "lint_all"
}

stop_section_jest_changed() {
  local changed="$1" fp="$2"
  local jest_relevant jest_output jest_status

  if stop_notified_for_fingerprint "jest_changed" "$fp"; then
    return 0
  fi

  jest_relevant="$(printf '%s\n' "$changed" | grep -E '^src/.*\.(ts|tsx)$|^\.jest/|^jest\.config\.(ts|js|mjs)$' || true)"
  [ -z "$jest_relevant" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "jest_changed" "$fp"
    printf '%s\n\n' "$(printf 'Jest check: source/test files changed but pnpm is unavailable. Manual check: mise exec -- pnpm test:changed\n\nChanged files:\n%s' "$jest_relevant")"
    return 0
  fi

  if ! git rev-parse --verify origin/staging^{commit} >/dev/null 2>&1; then
    return 0
  fi

  jest_output=""
  jest_status=0
  jest_output="$(JEST_CHANGED_INCLUDE_WORKTREE=1 bash "$STOP_ROOT/scripts/jest-changed.sh" origin/staging 2>&1)" || jest_status=$?

  if [ "$jest_status" -ne 0 ]; then
    stop_mark_notified "jest_changed" "$fp"
    printf '%s\n\n' "$(printf 'Jest failed for changes in this session. Fix the failures below, then run `pnpm test:changed` (or `pnpm test:ci` before push).\n\nChanged files:\n%s\n\nJest output:\n%s' "$jest_relevant" "$jest_output")"
    return 0
  fi

  stop_clear_notified "jest_changed"
}

stop_section_login_copy_jest() {
  local changed="$1" fp="$2"
  local copy_changed jest_output jest_status

  if stop_notified_for_fingerprint "login_copy_jest" "$fp"; then
    return 0
  fi

  copy_changed="$(printf '%s\n' "$changed" | grep -E '^src/constants/(loginPageCopy|userFacingCopy|marketingPublicCopy|supportProjectToast|about|donate|settingsCopy|dashboardCopy|cookieConsentCopy|sentryUserFeedbackForm|publicReleaseListen|playlistPlaybackCopy)\.ts$|^src/components/Login/loginFeatures\.constants\.ts$|^src/components/(Login/Login|LoginBottomCta/LoginBottomCta|SupportProjectToast/supportProjectToast|About/AboutDonationSection|CookieConsentBanner/CookieConsentBanner|Settings/SettingsClient|Settings/SettingsSectionPanels|Dashboard/DuplicatesList)\.component\.tsx$|^src/utils/dashboardStory\.ts$' || true)"
  [ -z "$copy_changed" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "login_copy_jest" "$fp"
    printf '%s\n\n' "$(printf 'User-facing copy drift check: copy source files changed but pnpm is unavailable (install mise tools with `mise install`, then re-run). Manual check: mise exec -- pnpm jest src/tests/utils/loginPageCopyLiteraryRules.spec.ts\n\nChanged copy files:\n%s' "$copy_changed")"
    return 0
  fi

  jest_output=""
  jest_status=0
  jest_output="$(run_pnpm jest src/tests/utils/loginPageCopyLiteraryRules.spec.ts --runInBand --no-cache 2>&1)" || jest_status=$?

  if [ "$jest_status" -ne 0 ]; then
    stop_mark_notified "login_copy_jest" "$fp"
    printf '%s\n\n' "$(printf 'User-facing copy drift check failed literary rules. Update copy to remove em dashes, embellishment, and inaccurate claims. Registry: src/constants/userFacingCopy.registry.ts. Rules: src/tests/utils/loginPageCopyLiteraryRules.ts\n\nChanged copy files:\n%s\n\nTest output:\n%s' "$copy_changed" "$jest_output")"
    return 0
  fi

  stop_clear_notified "login_copy_jest"
}

stop_section_handbook_test_jest() {
  local changed="$1" fp="$2"
  local feature_tests_changed jest_output jest_status

  if stop_notified_for_fingerprint "handbook_test_jest" "$fp"; then
    return 0
  fi

  feature_tests_changed="$(printf '%s\n' "$changed" | grep -E '\.(spec|po)\.(ts|tsx)$' || true)"
  [ -z "$feature_tests_changed" ] && return 0

  if ! run_pnpm --version >/dev/null 2>&1; then
    stop_mark_notified "handbook_test_jest" "$fp"
    printf '%s\n\n' "$(printf 'Handbook test drift check: feature test files changed but pnpm is unavailable (install mise tools with `mise install`, then re-run). Manual check: mise exec -- pnpm jest src/tests/utils/handbookTestRules.spec.ts\n\nChanged test files:\n%s' "$feature_tests_changed")"
    return 0
  fi

  jest_output=""
  jest_status=0
  jest_output="$(run_pnpm jest src/tests/utils/handbookTestRules.spec.ts --runInBand --no-cache 2>&1)" || jest_status=$?

  if [ "$jest_status" -ne 0 ]; then
    stop_mark_notified "handbook_test_jest" "$fp"
    printf '%s\n\n' "$(printf 'Handbook testing drift check failed. Feature tests must mock src/api/urls — not query/mutation hooks under src/hooks/queries/ or src/hooks/mutations/, and no specs in those folders. Rules: src/tests/utils/handbookTestRules.ts. Handbook: docs/handbook/conventions.md (Do not test React Query).\n\nChanged test files:\n%s\n\nTest output:\n%s' "$feature_tests_changed" "$jest_output")"
    return 0
  fi

  stop_clear_notified "handbook_test_jest"
}
