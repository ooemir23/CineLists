#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup (DATABASE_URL available at runtime)
echo "Pushing database schema..."
npx prisma db push --accept-data-loss 2>&1 || echo "WARNING: DB push failed, continuing..."

echo "Starting Next.js server on port 3000..."
exec node server.js
