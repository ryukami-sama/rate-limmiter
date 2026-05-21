# Rate Limiter — Full Stack

## Live Demo

**URL:** `[https://your-app.up.railway.app](https://frontend-production-222f.up.railway.app/)`

## Local Setup

### Prerequisites

- Docker and Docker Compose

### Run everything

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) for the demo UI. The backend listens on [http://localhost:3001](http://localhost:3001).

### Run without Docker

From the repo root (npm workspaces link `shared/` into both apps):

```bash
npm install
```

Terminal 1 — Redis:

```bash
redis-server
```

Terminal 2 — Backend:

```bash
npm run dev -w rate-limiter-backend
# or: cd backend && REDIS_URL=redis://localhost:6379 npm run dev
```

Terminal 3 — Frontend:

```bash
npm run dev -w rate-limiter-frontend
# or: cd frontend && NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

### Tests

From the repo root (requires Redis on `localhost:6379`):

```bash
npm install
npm test
```

CI runs the same suite on every push via GitHub Actions.

## API

| Endpoint | Rate limited | Description |
|----------|--------------|-------------|
| `GET /api/health` | No | Health check (includes Redis connectivity) |
| `GET /api/hello/token-bucket` | Yes | Demo endpoint using Token Bucket |
| `GET /api/hello/fixed-window` | Yes | Demo endpoint using Fixed Window |

### Response headers

Every rate-limited response includes:

- `X-RateLimit-Limit` — max requests allowed in the window
- `X-RateLimit-Remaining` — requests remaining
- `X-RateLimit-Reset` — Unix timestamp when the limit resets

On `429 Too Many Requests`:

- `Retry-After` — seconds until the client should retry
- Response body includes `{ error, retryAfter, resetAt }` as a fallback when headers are unavailable

### Configuration

Backend env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGIN` | `*` | Allowed frontend origin |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window size in milliseconds |

Frontend env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend base URL |

## Design Decisions

### Why Token Bucket over Sliding Window Log

**Token Bucket** is the primary algorithm because it offers O(1) memory per key, allows controlled bursting (a production-standard pattern), and avoids storing per-request timestamps. **Fixed Window** is simpler and cheaper but can allow short spikes at window boundaries (e.g. 10 requests at 0:59 and 10 at 1:00). **Sliding Window Log** is more precise — it counts only requests within the trailing window — but costs O(n) memory per key and requires pruning old entries on every check. For high-traffic APIs, Token Bucket is the better default; Sliding Window Log is a good option when strict fairness matters more than memory.

### Why Redis

Rate limits must be consistent across multiple backend instances. In-memory counters break as soon as you scale horizontally. **Redis** provides shared, low-latency state with **atomic Lua scripts** so concurrent requests cannot race past the limit. `MULTI/EXEC` would also work; Lua keeps the read-modify-write in a single round trip.

### Production additions

- Sliding window log or sliding window counter as a third algorithm option
- Per-endpoint rate limit configuration
- Tiered limits (free vs paid plans)
- Redis Cluster / Sentinel for HA
- Metrics and alerting (Prometheus, Datadog)
- Allowlist / blocklist bypass rules
- Distributed tracing on 429 responses

### Production-minded details

- **Shared contract:** `shared/` defines API types, header names, route paths, and defaults consumed by both backend and frontend
- **Backend:** algorithm registry, unified route registration, request IDs, structured logging, Redis-aware health checks, graceful shutdown with timeout, 503 when Redis is unavailable
- **Frontend:** shadcn/ui, TanStack Query (health polling + request mutations), typed API client, per-algorithm cache, pure countdown helpers

### NestJS mapping

Implemented as Express middleware; maps directly to a NestJS Guard via `CanActivate` — available on request. The shared `checkRateLimit(key, options)` function in `backend/src/middleware/rateLimiter.ts` can be injected into a guard without changing algorithm logic.

## Deploy to Railway

See **[RAILWAY.md](./RAILWAY.md)** for the full guide. Summary:

1. Add **Redis**, **backend**, and **frontend** services (repo root as build context)
2. Point each service at `/backend/railway.toml` and `/frontend/railway.toml`
3. Set reference variables: `REDIS_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`
4. Generate public domains on backend and frontend

## Project Structure

```
rate-limiter/
├── shared/                   # API contract (types, headers, routes, defaults)
├── backend/
│   ├── railway.toml          # Railway build/deploy config
│   ├── src/
│   │   ├── algorithms/       # Lua scripts + registry
│   │   ├── middleware/       # rate limiter, headers, CORS, logging
│   │   ├── routes/
│   │   ├── createApp.ts      # app factory (prod + tests)
│   │   └── ...
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── railway.toml
│   ├── app/
│   │   └── page.tsx
│   └── package.json
├── .github/workflows/ci.yml
├── docker-compose.yml
├── RAILWAY.md
└── README.md
```
