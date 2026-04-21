#!/bin/sh
set -e

echo "=== CineLists Starting ==="

# Run Prisma migrations at startup (DATABASE_URL available at runtime)
echo "Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || echo "WARNING: Migration failed, continuing..."

# Start the Next.js server
echo "Starting Next.js server on port 3000..."
exec node server.js
