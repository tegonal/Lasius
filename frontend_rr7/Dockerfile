# Base image with Node.js and the Yarn version from package.json#packageManager
FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable

# Install all dependencies. The xlsx package downloads from cdn.sheetjs.com.
FROM base AS deps
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install --immutable

# Install the production dependencies only
FROM base AS prod-deps
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn workspaces focus --production

# Build the application
FROM deps AS builder
COPY . .
RUN yarn build

# Production image
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# The loaders compute day boundaries on the server, in this time zone.
ENV TZ=Europe/Zurich
# react-router-serve takes the next free port when PORT is not set.
ENV PORT=3000
ARG LASIUS_VERSION
ARG COMMIT_SHORT_SHA
ENV LASIUS_VERSION=$LASIUS_VERSION
LABEL git-commit=$COMMIT_SHORT_SHA

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/build ./build
# public/ holds the help MDX files that /api/help reads at runtime. Operators mount the
# Terms of Service files at /app/public/termsofservice.
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node package.json ./

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + process.env.PORT + '/api/health').then(x => x.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]
