#!/usr/bin/env bash
set -euo pipefail

# stop: if prisma/schema.prisma changed, nudge prisma generate once per session.

input="$(cat)"
loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"

if [ "$loop_count" -ge 1 ]; then
  exit 0
fi

root="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$root" ] && cd "$root"

changed="$( {
  git diff --name-only HEAD 2>/dev/null
  git diff --cached --name-only 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
} | sort -u)"

schema_changed="$(printf '%s\n' "$changed" | grep -E '^prisma/schema\.prisma$' || true)"

if [ -z "$schema_changed" ]; then
  exit 0
fi

reason="$(cat <<'EOF'
Prisma schema changed this session. Run `pnpm db:generate` (or `mise exec -- pnpm db:generate`) so `@prisma/client` matches the schema before `pnpm tsc:ci` or dev. Commit generated client updates if your workflow expects them after migrate.
EOF
)"

jq -n --arg r "$reason" '{ followup_message: $r }'
