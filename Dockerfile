# ─────────────────────────────────────────────────────────────
# Multi-stage build for the Next.js app (App Router, standalone output).
# The database/auth/storage live in Supabase (cloud), so no DB container.
# ─────────────────────────────────────────────────────────────

# 1) Dependencies ---------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Debian slim ships full ICU (needed for correct Europe/Madrid date handling).
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
# Use a clean, reproducible install when a lockfile exists.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2) Build ----------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars must be present at build time (they are inlined).
# docker-compose passes them through via the `args`/`environment` blocks.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Runtime --------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Run as an unprivileged user.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Copy the standalone server + static assets only.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
