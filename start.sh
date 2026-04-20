#!/bin/sh
set -e

# Run Prisma migrations at startup (DATABASE_URL available at runtime)
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
