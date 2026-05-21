FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY backend ./backend

RUN npm ci
RUN npm run build -w @rate-limiter/shared && npm run build -w rate-limiter-backend

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

COPY package.json package-lock.json /app/
COPY shared/package.json /app/shared/
COPY backend/package.json ./

RUN cd /app && npm ci --omit=dev --workspace=rate-limiter-backend --workspace=@rate-limiter/shared

COPY --from=builder /app/shared/dist /app/shared/dist
COPY --from=builder /app/backend/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
