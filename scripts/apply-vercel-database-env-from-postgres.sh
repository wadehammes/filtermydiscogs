#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 production|preview|development"
  exit 1
fi

TARGET="$1"
case "$TARGET" in
  production | preview | development) ;;
  *)
    echo "Invalid target: $TARGET"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

vercel env pull "$TMP/.env" --environment="$TARGET" --yes

node --experimental-strip-types "$ROOT/scripts/sync-pooled-database-url-from-postgres.ts" "$TMP/.env"

read_env() {
  local key="$1"
  grep -E "^${key}=" "$TMP/.env" | head -1 | cut -d= -f2- | sed 's/^["'\''"]//;s/["'\''"]$//'
}

DIRECT="$(read_env DATABASE_URL)"
POOLED="$(read_env DATABASE_URL_POOLED)"
POSTGRES="$(read_env POSTGRES_URL)"

if [ -z "$POSTGRES" ] || [ -z "$DIRECT" ] || [ -z "$POOLED" ]; then
  echo "Missing POSTGRES_URL or derived DATABASE URLs in pull for $TARGET"
  exit 1
fi

pg_user="${POSTGRES#*://}"
pg_user="${pg_user%%:*}"
db_user="${DIRECT#*://}"
db_user="${db_user%%:*}"
pool_user="${POOLED#*://}"
pool_user="${pool_user%%:*}"

if [ "$pg_user" != "$db_user" ] || [ "$pg_user" != "$pool_user" ]; then
  echo "Refusing to update $TARGET: DATABASE URLs do not match POSTGRES_URL identity"
  exit 1
fi

printf '%s' "$DIRECT" | vercel env update DATABASE_URL "$TARGET" --yes
printf '%s' "$POOLED" | vercel env update DATABASE_URL_POOLED "$TARGET" --yes 2>/dev/null \
  || printf '%s' "$POOLED" | vercel env add DATABASE_URL_POOLED "$TARGET"

echo "Updated DATABASE_URL (direct) and DATABASE_URL_POOLED for $TARGET (user prefix ${pg_user:0:8}…)."
