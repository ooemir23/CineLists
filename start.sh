#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup
echo "Attempting to push database schema using direct path..."
if ./node_modules/.bin/prisma db push --accept-data-loss; then
    echo "SUCCESS: Database schema pushed successfully."
else
    echo "ERROR: Database push failed! Trying with npx as fallback..."
    if npx prisma db push --accept-data-loss; then
        echo "SUCCESS: Database schema pushed successfully via npx."
    else
        echo "CRITICAL ERROR: All database push attempts failed."
    fi
fi

echo "Starting Next.js server on port 3000..."
exec node server.js
