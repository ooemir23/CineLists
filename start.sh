#!/bin/sh
set -e

echo "=== CineLists Starting ==="

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Next.js server on port 3000..."
exec node server.js
