#!/bin/bash
# Helper script to pull DATABASE_URL from Vercel for different environments
# Usage: ./scripts/pull-db-env.sh [production|development|preview]

ENVIRONMENT=${1:-development}

echo "Pulling DATABASE_URL for $ENVIRONMENT environment..."

if [ "$ENVIRONMENT" = "production" ]; then
  vercel env pull .env.local --environment=production --yes
  echo "✅ Production DATABASE_URL pulled to .env.local"
elif [ "$ENVIRONMENT" = "development" ]; then
  vercel env pull .env.local --environment=development --yes
  echo "✅ Development DATABASE_URL pulled to .env.local"
elif [ "$ENVIRONMENT" = "preview" ]; then
  vercel env pull .env.local --environment=preview --yes
  echo "✅ Preview DATABASE_URL pulled to .env.local"
else
  echo "❌ Invalid environment. Use: production, development, or preview"
  exit 1
fi

echo ""
echo "Current DATABASE_URL (first 50 chars):"
grep DATABASE_URL .env.local | head -1 | cut -c1-50

