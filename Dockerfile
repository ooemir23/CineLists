# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
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
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ARG APP_COMMIT_SHA=unknown
ARG APP_BUILD_DATE=unknown
ARG APP_DEPLOYMENT_ID

ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_DATE=$APP_BUILD_DATE
ENV APP_DEPLOYMENT_ID=$APP_DEPLOYMENT_ID
ENV MAIL_FROM="CineLists <noreply@cinelists.com>"
ENV NEXT_PUBLIC_APP_URL=https://cinelists.com
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build only; database migrations are run separately from the web container
RUN --mount=type=secret,id=server_actions_key \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(cat /run/secrets/server_actions_key 2>/dev/null || true)" npm run build

# Production stage
FROM base AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ARG APP_COMMIT_SHA=unknown
ARG APP_BUILD_DATE=unknown
ARG APP_DEPLOYMENT_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_DATE=$APP_BUILD_DATE
ENV APP_DEPLOYMENT_ID=$APP_DEPLOYMENT_ID
ENV MAIL_FROM="CineLists <noreply@cinelists.com>"
ENV NEXT_PUBLIC_APP_URL=https://cinelists.com
ENV AUTH_URL=https://cinelists.com
ENV NEXTAUTH_URL=https://cinelists.com
ENV AUTH_TRUST_HOST=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/BUILD_ID ./.next/BUILD_ID
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/start.sh ./

# Create necessary directories with correct permissions.
RUN mkdir -p /app/.prisma /app/.next/cache && \
    chown -R nextjs:nodejs /app && \
    chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./start.sh"]
