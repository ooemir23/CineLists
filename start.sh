#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup
echo "Attempting to push database schema..."
if prisma db push --accept-data-loss --skip-generate; then
    echo "SUCCESS: Database schema pushed successfully."
else
    echo "ERROR: Database push failed! Please check DATABASE_URL and connectivity."
fi

echo "Starting Next.js server on port 3000..."
exec node server.js
