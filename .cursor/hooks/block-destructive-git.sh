#!/usr/bin/env bash
set -euo pipefail

# beforeShellExecution: block force-push to protected branches and destructive git.

source "$(dirname "$0")/_lib.sh"
hook_input

command="$(printf '%s' "$INPUT" | jq -r '.command // empty')"

case "$command" in
  *git\ reset\ --hard* | *git\ clean\ -f*)
    reason='Blocked: git reset --hard and git clean -fdx/-fd are not allowed for agents. Discard changes with targeted git restore or ask the user to run destructive git locally.'
    jq -n --arg r "$reason" '{
      permission: "deny",
      user_message: $r,
      agent_message: $r
    }'
    exit 0
    ;;
esac

if printf '%s' "$command" | grep -qE 'git push'; then
  if printf '%s' "$command" | grep -qE '(--force|-f\b|force-with-lease)'; then
    if printf '%s' "$command" | grep -qE '(refs/heads/)?(main|staging)([: ]|$|/)'; then
      reason='Blocked: force push to main or staging. Use normal push on a feature branch and open a PR into staging.'
      jq -n --arg r "$reason" '{
        permission: "deny",
        user_message: $r,
        agent_message: $r
      }'
      exit 0
    fi
  fi
fi

exit 0
