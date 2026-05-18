#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup when DATABASE_URL is available
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Attempting to deploy database migrations..."
    if prisma migrate deploy; then
        echo "SUCCESS: Database migrations deployed successfully."
    else
        echo "ERROR: Database migration deploy failed! Please check DATABASE_URL and connectivity."
    fi
else
    echo "DATABASE_URL is not set. Skipping database migrations."
fi

echo "Starting Next.js server on port 3000..."
exec node server.js
