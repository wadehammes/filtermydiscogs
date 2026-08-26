#!/usr/bin/env bash
# Apply pending migrations during CI/Vercel builds.
# Retries transient P1001 errors from Prisma Postgres cold starts / build-network blips.
set -euo pipefail

resolve_migrate_url() {
  if [ -n "${DIRECT_URL:-}" ]; then
    printf '%s' "$DIRECT_URL"
    return
  fi
  if [ -n "${POSTGRES_URL:-}" ]; then
    printf '%s' "$POSTGRES_URL"
    return
  fi
  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s' "$DATABASE_URL"
    return
  fi
}

append_connect_timeout() {
  local url="$1"
  if [[ "$url" == *"connect_timeout="* ]]; then
    printf '%s' "$url"
    return
  fi
  if [[ "$url" == *"?"* ]]; then
    printf '%s' "${url}&connect_timeout=30"
  else
    printf '%s' "${url}?connect_timeout=30"
  fi
}

MIGRATE_URL="$(resolve_migrate_url || true)"

if [ -z "${MIGRATE_URL:-}" ]; then
  echo "Skipping prisma migrate deploy (no DIRECT_URL, POSTGRES_URL, or DATABASE_URL)."
  exit 0
fi

export DATABASE_URL="$(append_connect_timeout "$MIGRATE_URL")"

MAX_ATTEMPTS="${PRISMA_MIGRATE_DEPLOY_ATTEMPTS:-5}"
RETRY_DELAY_SEC="${PRISMA_MIGRATE_DEPLOY_RETRY_DELAY_SEC:-5}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "Running prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})..."
  if pnpm exec prisma migrate deploy; then
    echo "Migrations applied successfully."
    exit 0
  fi

  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "prisma migrate deploy failed after ${MAX_ATTEMPTS} attempts."
    exit 1
  fi

  echo "Attempt ${attempt} failed (often P1001 on Prisma Postgres cold start); retrying in ${RETRY_DELAY_SEC}s..."
  sleep "$RETRY_DELAY_SEC"
  RETRY_DELAY_SEC=$((RETRY_DELAY_SEC * 2))
  attempt=$((attempt + 1))
done
