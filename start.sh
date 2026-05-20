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

echo "Running database migrations..."
if ! npx prisma migrate deploy; then
    echo "Prisma migrate deploy failed. Attempting one-time baseline for existing database..."

    for migration_dir in /app/prisma/migrations/*; do
        [ -d "$migration_dir" ] || continue

        migration_name="$(basename "$migration_dir")"
        case "$migration_name" in
            migration_lock.toml)
                continue
                ;;
        esac

        echo "Marking migration as applied: $migration_name"
        npx prisma migrate resolve --applied "$migration_name" || true
    done

    echo "Re-running database migrations after baseline..."
    npx prisma migrate deploy
fi

echo "Starting Next.js server on port 3000..."
exec node server.js
