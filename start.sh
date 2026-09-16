#!/bin/sh
set -e

echo "=== CineLists Starting ==="

export PORT=3000
export HOSTNAME="0.0.0.0"

if [ -z "$AUTH_SECRET" ]; then
  if [ -n "$NEXTAUTH_SECRET" ]; then
    export AUTH_SECRET="$NEXTAUTH_SECRET"
  else
    export AUTH_SECRET="cinelists-secret-key-development-2026-auth-3891724"
    export NEXTAUTH_SECRET="cinelists-secret-key-development-2026-auth-3891724"
  fi
fi

if [ -z "$AUTH_TRUST_HOST" ]; then
  export AUTH_TRUST_HOST="true"
fi

if [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]; then
  export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$AUTH_SECRET"
fi

echo "--- Runtime Environment Check ---"
echo "NODE_ENV=$NODE_ENV"
echo "HOSTNAME=$HOSTNAME"
echo "PORT=$PORT"
echo "AUTH_URL=$AUTH_URL"
echo "NEXTAUTH_URL=$NEXTAUTH_URL"
echo "AUTH_TRUST_HOST=$AUTH_TRUST_HOST"
echo "APP_COMMIT_SHA=${APP_COMMIT_SHA:-unknown}"
echo "APP_BUILD_DATE=${APP_BUILD_DATE:-unknown}"
echo "APP_DEPLOYMENT_ID=${APP_DEPLOYMENT_ID:-unknown}"
echo "NEXT_BUILD_ID=$(cat /app/.next/BUILD_ID 2>/dev/null || echo 'unknown')"
echo "Has AUTH_SECRET: $([ -n "$AUTH_SECRET" ] && echo 'YES (length:'${#AUTH_SECRET}')' || echo 'NO')"
echo "Has NEXTAUTH_SECRET: $([ -n "$NEXTAUTH_SECRET" ] && echo 'YES' || echo 'NO')"
echo "Has NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: $([ -n "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ] && echo 'YES' || echo 'NO')"
echo "Has AUTH_GOOGLE_ID: $([ -n "$AUTH_GOOGLE_ID" ] && echo 'YES ('$(echo $AUTH_GOOGLE_ID | cut -c1-15)'...)' || echo 'NO')"
echo "Has AUTH_GOOGLE_SECRET: $([ -n "$AUTH_GOOGLE_SECRET" ] && echo 'YES ('$(echo $AUTH_GOOGLE_SECRET | cut -c1-8)'...)' || echo 'NO')"
echo "Has TMDB_API_KEY: $([ -n "$TMDB_API_KEY" ] && echo 'YES' || echo 'NO')"
echo "Has DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "--- End Environment Check ---"

echo "Starting Next.js server on port 3000..."
exec node server.js
