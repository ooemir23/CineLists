#!/bin/sh
set -e

echo "=== CineLists Starting ==="

echo "--- Runtime Environment Check ---"
echo "NODE_ENV=$NODE_ENV"
echo "AUTH_URL=$AUTH_URL"
echo "NEXTAUTH_URL=$NEXTAUTH_URL"
echo "AUTH_TRUST_HOST=$AUTH_TRUST_HOST"
echo "Has AUTH_SECRET: $([ -n "$AUTH_SECRET" ] && echo 'YES (length:'${#AUTH_SECRET}')' || echo 'NO')"
echo "Has NEXTAUTH_SECRET: $([ -n "$NEXTAUTH_SECRET" ] && echo 'YES' || echo 'NO')"
echo "Has AUTH_GOOGLE_ID: $([ -n "$AUTH_GOOGLE_ID" ] && echo 'YES ('$(echo $AUTH_GOOGLE_ID | cut -c1-15)'...)' || echo 'NO')"
echo "Has AUTH_GOOGLE_SECRET: $([ -n "$AUTH_GOOGLE_SECRET" ] && echo 'YES ('$(echo $AUTH_GOOGLE_SECRET | cut -c1-8)'...)' || echo 'NO')"
echo "Has DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "--- End Environment Check ---"

echo "Starting Next.js server on port 3000..."
exec node server.js
