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

ARG APP_COMMIT_SHA=unknown
ARG APP_BUILD_DATE=unknown
ARG APP_DEPLOYMENT_ID
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_DATE=$APP_BUILD_DATE
ENV APP_DEPLOYMENT_ID=$APP_DEPLOYMENT_ID
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables are provided by Dokploy at runtime

# Build only; database migrations are run separately from the web container
RUN npm run build

# Production stage
FROM base AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ARG APP_COMMIT_SHA=unknown
ARG APP_BUILD_DATE=unknown
ARG APP_DEPLOYMENT_ID
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV APP_COMMIT_SHA=$APP_COMMIT_SHA
ENV APP_BUILD_DATE=$APP_BUILD_DATE
ENV APP_DEPLOYMENT_ID=$APP_DEPLOYMENT_ID
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
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
