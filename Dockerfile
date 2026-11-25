# =============================================================================
# ScamHisn AI (حصن الاحتيال): image built from the REPOSITORY ROOT
#
# Render (or any Docker host) can point at this repository as it is: no "root
# directory" setting is needed. It builds the app in "Deployable Website
# Application/" exactly as the Dockerfile inside that folder does. Keep the two
# files in step when you change either.
# =============================================================================

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY ["Deployable Website Application/package.json", "Deployable Website Application/package-lock.json", "Deployable Website Application/tsconfig.base.json", "./"]
COPY ["Deployable Website Application/packages/shared/package.json", "Deployable Website Application/packages/shared/tsconfig.json", "./packages/shared/"]
COPY ["Deployable Website Application/apps/api/package.json", "Deployable Website Application/apps/api/tsconfig.json", "./apps/api/"]
COPY ["Deployable Website Application/apps/web/package.json", "Deployable Website Application/apps/web/tsconfig.json", "./apps/web/"]

RUN npm ci

COPY ["Deployable Website Application/packages/shared", "./packages/shared"]
COPY ["Deployable Website Application/apps/api", "./apps/api"]
COPY ["Deployable Website Application/apps/web", "./apps/web"]

RUN npm run build

# -----------------------------------------------------------------------------
# Production runtime stage
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV PLAYWRIGHT_HEADLESS=true

COPY ["Deployable Website Application/package.json", "Deployable Website Application/package-lock.json", "./"]
COPY ["Deployable Website Application/packages/shared/package.json", "./packages/shared/"]
COPY ["Deployable Website Application/apps/api/package.json", "./apps/api/"]
COPY ["Deployable Website Application/apps/web/package.json", "./apps/web/"]

# Production dependencies only
RUN npm ci --omit=dev

# Only the lightweight Chromium headless shell and the Linux libraries it needs
RUN npx playwright install --with-deps --only-shell chromium \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
