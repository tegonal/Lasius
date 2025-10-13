# Base image with Node.js
FROM node:24-alpine AS base

# Install dependencies only
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
COPY package.json yarn.lock ./
RUN corepack enable
RUN yarn install --immutable

# Build the application
FROM base AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1
ARG LASIUS_VERSION
ARG COMMIT_SHORT_SHA
LABEL git-commit=$COMMIT_SHORT_SHA

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY . .

RUN corepack enable

# Update version in package.json
RUN node ./scripts/updatePackageJsonVersion.js $LASIUS_VERSION

# Build the Next.js application
RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Zurich
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG LASIUS_VERSION
ARG COMMIT_SHORT_SHA
LABEL git-commit=$COMMIT_SHORT_SHA

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone build output (contains minimal traced dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files (built CSS/JS)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets (images, fonts, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(x => x.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
