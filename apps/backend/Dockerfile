# syntax=docker/dockerfile:1
#
# Build context: monorepo root (not apps/backend/).
# Usage:
#   docker build -f apps/backend/Dockerfile --target final .
#   docker build -f apps/backend/Dockerfile --target development .

ARG NODE_VERSION=22.14.0
ARG PNPM_VERSION=10.17.1

################################################################################
# Base image with Node.js and pnpm.
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Install all dependencies and build the backend.
FROM base AS build

# Copy all workspace package manifests so pnpm can resolve the full lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/logger/package.json ./packages/logger/
COPY packages/pipeline/package.json ./packages/pipeline/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install all workspace dependencies (including devDependencies for tsc)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy all package sources
COPY packages/types/ ./packages/types/
COPY packages/logger/ ./packages/logger/
COPY packages/pipeline/ ./packages/pipeline/

# Build workspace packages in dependency order before building the backend
WORKDIR /usr/src/app/packages/logger
RUN pnpm run build

WORKDIR /usr/src/app/packages/pipeline
RUN pnpm run build

# Copy backend source code and compile
COPY apps/backend/ ./apps/backend/
WORKDIR /usr/src/app/apps/backend
RUN pnpm run build

# Create a standalone production bundle with only prod dependencies.
# pnpm deploy flattens the workspace into a self-contained directory.
# --legacy is required for pnpm v10 when workspace packages are not injected.
WORKDIR /usr/src/app
RUN pnpm --filter ai-job-hunter deploy --prod --legacy /prod/backend

################################################################################
# Development stage — source files are volume-mounted via docker compose.
FROM base AS development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter ai-job-hunter

WORKDIR /usr/src/app/apps/backend

ENV NODE_ENV=development
EXPOSE 4000
CMD ["pnpm", "run", "dev"]

################################################################################
# Minimal production image.
FROM node:${NODE_VERSION}-alpine AS final

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy the self-contained deployment bundle from the build stage
COPY --from=build /prod/backend ./

RUN chown -R node:node /usr/src/app
USER node
EXPOSE 4000

CMD ["node", "dist/index.js"]
