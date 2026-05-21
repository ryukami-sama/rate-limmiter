FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY frontend ./frontend

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# npm ci + workspaces skips platform optional deps (lightningcss, @tailwindcss/oxide).
# npm install resolves native bindings for the build target.
RUN npm install --include=optional
RUN npm run build -w @rate-limiter/shared && npm run build -w rate-limiter-frontend

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone/frontend ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs
EXPOSE 3000
# Railway injects HOSTNAME (container id). Next.js binds to it instead of 0.0.0.0,
# which makes healthchecks fail — override for the node process only.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
