# =============================================================================
# ScamHisn AI (حصن الاحتيال) — Production Multi-Stage Dockerfile
# Lightweight Node 22 Bookworm + Playwright Chromium Headless Shell (--only-shell)
# =============================================================================

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

RUN npm run build

# -----------------------------------------------------------------------------
# Production Runtime Stage
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV PLAYWRIGHT_HEADLESS=true

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install production dependencies only for workspaces
RUN npm ci --omit=dev

# Install ONLY the lightweight Chromium headless shell + required Linux libs
RUN npx playwright install --with-deps --only-shell chromium \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
