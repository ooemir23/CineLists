FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Generate Prisma client (no DB connection needed)
RUN npx prisma generate

# Build stage
FROM base AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env vars for next build - NextAuth requires these at build time
# Real values are injected by Dokploy at runtime and override these
ENV AUTH_SECRET="build-time-placeholder-secret-do-not-use"
ENV AUTH_GOOGLE_ID="build-time-placeholder"
ENV AUTH_GOOGLE_SECRET="build-time-placeholder"
ENV AUTH_URL="http://localhost:3000"
ENV AUTH_TRUST_HOST="true"

# Build only (no migration - that runs at startup)
RUN npm run build

# Production stage
FROM base AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/start.sh ./
# Copy prisma schema and migrations so we can run migrate deploy at startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Create necessary directories with correct permissions.
RUN mkdir -p /app/.prisma /app/.next/cache && \
    chown -R nextjs:nodejs /app && \
    chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
