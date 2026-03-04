FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY apps/server/package*.json apps/server/
COPY packages/shared/package*.json packages/shared/
RUN npm ci --workspaces

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/server

# ─── Runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bizbot
USER bizbot

COPY --from=builder --chown=bizbot:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=bizbot:nodejs /app/apps/server/package.json .
COPY --from=builder --chown=bizbot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bizbot:nodejs /app/apps/server/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
