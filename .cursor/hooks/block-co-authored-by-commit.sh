#!/usr/bin/env bash
set -euo pipefail

# beforeShellExecution: agents must commit via scripts/git-commit.sh (or explicit
# core.hooksPath=.githooks) so commit-msg can strip/block Co-authored-by trailers.

source "$(dirname "$0")/_lib.sh"
hook_input

command="$(printf '%s' "$INPUT" | jq -r '.command // empty')"

case "$command" in
  *git\ commit*) ;;
  *) exit 0 ;;
esac

if printf '%s' "$command" | grep -qiE 'co-authored-by:|cursoragent@cursor\.com'; then
  reason='Blocked: git commit must not include Co-authored-by trailers (or cursoragent@cursor.com). Write the commit message without co-author lines and retry.'
  jq -n --arg r "$reason" '{
    permission: "deny",
    user_message: $r,
    agent_message: $r
  }'
  exit 0
fi

if printf '%s' "$command" | grep -qE 'core\.hooksPath=\.githooks|scripts/git-commit\.sh'; then
  exit 0
fi

reason='Blocked: use scripts/git-commit.sh (or git -c core.hooksPath=.githooks commit) so commit-msg hooks reject Co-authored-by trailers injected by tooling.'
jq -n --arg r "$reason" '{
  permission: "deny",
  user_message: $r,
  agent_message: $r
}'
exit 0
