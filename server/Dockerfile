# syntax=docker/dockerfile:1

# Prisma 7 talks to Postgres through a driver adapter (@prisma/adapter-pg), so
# there is no native query engine binary to match against the OS — that's why
# Alpine works here without the usual openssl/libc gymnastics.
ARG NODE_VERSION=22-alpine

# --- deps: everything, for building ------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# --- prod-deps: a clean production-only tree ----------------------------------
# Installed separately rather than pruning the tree above: `pnpm prune --prod`
# leaves the dev packages behind in node_modules/.pnpm, which kept the Prisma
# CLI, TypeScript and Studio (~160MB) in the image.
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod

# @prisma/client declares `prisma` and `typescript` as OPTIONAL peers, but pnpm
# still materialises them because they're in devDependencies — dragging in the
# CLI, Studio and Prisma Dev (with effect and pglite behind them), roughly
# 160MB the running app never touches. It only needs @prisma/client's runtime.
RUN rm -rf node_modules/.pnpm/prisma@* \
           node_modules/.pnpm/typescript@* \
           node_modules/.pnpm/@prisma+studio-core@* \
           node_modules/.pnpm/@prisma+dev@* \
           node_modules/.pnpm/@prisma+engines@* \
           node_modules/.pnpm/effect@* \
           node_modules/.pnpm/@electric-sql+pglite@* \
           node_modules/prisma node_modules/typescript node_modules/.bin

# --- build: generate the Prisma client, then compile TypeScript ---------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# generate reads the schema only; the URL is never connected to at build time
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm exec prisma generate
RUN pnpm run build

# --- runtime -----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user; node:alpine already ships one
USER node

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

# Note: the Prisma CLI is a dev dependency, so it isn't here and
# `prisma migrate deploy` cannot run inside this image. Apply migrations as a
# separate release step (from CI, or a one-off container built on the `build`
# stage above, which does have the CLI).

EXPOSE 3000

# The app already exposes a DB-backed health endpoint — reuse it rather than
# just checking that the process is alive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# nest build emits to dist/src because prisma.config.ts sits outside src/
CMD ["node", "dist/src/main.js"]
