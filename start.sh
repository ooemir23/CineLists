#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup
echo "Attempting to push database schema..."
if /app/node_modules/.bin/prisma db push --accept-data-loss; then
    echo "SUCCESS: Database schema pushed successfully."
else
    echo "ERROR: Database push failed! Please check DATABASE_URL and connectivity."
fi

echo "Starting Next.js server on port 3000..."
exec node server.js
