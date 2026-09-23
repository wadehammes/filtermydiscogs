#!/usr/bin/env bash
set -euo pipefail

# Optional beforeSubmitPrompt reminder (disabled in hooks.json — redundant with AGENTS.md + always-on rule + sessionStart).

source "$(dirname "$0")/_lib.sh"
hook_input

prompt="$(printf '%s' "$INPUT" | jq -r '.prompt // .user_message // .message // empty' | tr -d '\n')"
prompt_trimmed="$(printf '%s' "$prompt" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

# Skip noise on ultra-short acknowledgements (yes, ok, thanks, …).
if [ "${#prompt_trimmed}" -lt 12 ]; then
  exit 0
fi

root="$(project_dir)"
readme="$root/docs/handbook/README.md"

if [ ! -f "$readme" ]; then
  exit 0
fi

ctx="$(cat <<'EOF'
Handbook first (docs/handbook/ — AGENTS.md): for substantive work, read README + llms.md-matched chapters before editing; TDD at feature/component specs; update handbook (and README when user-facing setup/features change) before finishing. Narrow mechanical fixes may skip.
EOF
)"

advise_context "$ctx"
exit 0
