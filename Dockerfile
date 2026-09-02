FROM node:20-slim AS base

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
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ARG AUTH_SECRET
ARG NEXTAUTH_SECRET

ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_DATE=$APP_BUILD_DATE
ENV APP_DEPLOYMENT_ID=$APP_DEPLOYMENT_ID
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV AUTH_SECRET=${AUTH_SECRET:-cinelists-secret-key-development-2026-auth-3891724}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-cinelists-secret-key-development-2026-auth-3891724}
ENV TMDB_API_KEY=bf8f936fe43431e6714917c0c9a172e5
ENV NEXT_PUBLIC_APP_URL=https://cinelists.com
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build only; database migrations are run separately from the web container
RUN npm run build

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

CMD ["./start.sh"]
