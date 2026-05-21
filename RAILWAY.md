# Railway Deployment Guide

Deploy the rate limiter demo to Railway with three services: **Redis**, **backend**, and **frontend**.

Config-as-code lives in [`backend/railway.toml`](./backend/railway.toml) and [`frontend/railway.toml`](./frontend/railway.toml). Cross-service wiring uses Railway [reference variables](https://docs.railway.com/variables#referencing-another-services-variable).

---

## Architecture

```
Browser → Frontend (Next.js) → Backend (Express) → Redis
```

Both app Dockerfiles build from the **repo root** (they copy `shared/`). Do not set Root Directory to `backend/` or `frontend/`.

---

## One-time setup (~15 min)

### 1. Create project

1. [railway.app](https://railway.app) → **New Project** → **Empty Project**
2. Connect your GitHub repo when adding services

### 2. Add Redis

1. **+ Create** → **Database** → **Redis**
2. Name the service `Redis` (reference variables use this name)

### 3. Add backend service

1. **+ Create** → **GitHub Repo** → select this repository
2. Rename service to `backend`
3. **Settings** → **Build**:
   - **Root Directory:** `/` (leave empty)
   - **Config file path:** `/backend/railway.toml`
4. **Settings** → **Networking** → **Generate Domain**
5. **Variables:**

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `REDIS_URL` | `${{Redis.REDIS_URL}}` |
   | `CORS_ORIGIN` | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |

   Use the variable picker to insert references. Service names must match what you named them (`Redis`, `frontend`).

6. Deploy and verify:

   ```bash
   curl https://<backend-domain>/api/health
   # → {"status":"ok","redis":"up"}
   ```

### 4. Add frontend service

1. **+ Create** → same GitHub repo
2. Rename service to `frontend`
3. **Settings** → **Build**:
   - **Root Directory:** `/` (leave empty)
   - **Config file path:** `/frontend/railway.toml`
4. **Settings** → **Networking** → **Generate Domain**
5. **Variables:**

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` | **Required at build time** — no trailing slash |

6. **Redeploy** frontend after setting `NEXT_PUBLIC_API_URL` (Next.js bakes this into the client bundle during `docker build`).

### 5. Wire CORS and redeploy backend

After frontend has a public domain, ensure backend has:

```
CORS_ORIGIN=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Redeploy **backend** if you added CORS before frontend existed.

### 6. Verify

1. Open `https://<frontend-domain>`
2. Send / Spam requests — stats and 429 banner should work
3. Update the Live Demo URL in [README.md](./README.md)

---

## Deploy order (first time)

```
Redis → backend (domain + health) → frontend (NEXT_PUBLIC_API_URL) → backend CORS redeploy
```

After setup, pushes to `main` redeploy automatically via watch paths in `railway.toml`.

---

## What `railway.toml` automates

| Setting | Backend | Frontend |
|---------|---------|----------|
| Dockerfile path | `backend/Dockerfile` | `frontend/Dockerfile` |
| Watch paths | `backend/**`, `shared/**` | `frontend/**`, `shared/**` |
| Health check | `/api/health` | `/` |
| Restart policy | On failure | On failure |

Changes to `shared/` trigger rebuilds on **both** services.

---

## Environment variables

### Backend

| Variable | Required | Example |
|----------|----------|---------|
| `REDIS_URL` | Yes | `${{Redis.REDIS_URL}}` |
| `CORS_ORIGIN` | Yes | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |
| `NODE_ENV` | Recommended | `production` |
| `PORT` | Auto | Set by Railway — do not override |
| `RATE_LIMIT_MAX` | No | `10` |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` |

### Frontend

| Variable | Required | When |
|----------|----------|------|
| `NEXT_PUBLIC_API_URL` | Yes | Build time |
| `PORT` | Auto | Runtime |

---

## Alternative: Docker Compose import

Railway can import [`docker-compose.yml`](./docker-compose.yml) by dragging it onto the project canvas. That scaffolds redis, backend, and frontend quickly.

You still must override production variables:

- Replace `CORS_ORIGIN: http://localhost:3000` with the frontend public URL
- Replace `NEXT_PUBLIC_API_URL: http://localhost:3001` with the backend public URL
- Assign each app service its `railway.toml` config file path

Compose import is a shortcut for step 1–3, not a full production config.

---

## Troubleshooting

### Frontend: "Backend unavailable"

- Wrong `NEXT_PUBLIC_API_URL` → set `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` and **redeploy** frontend
- Backend has no public domain → generate one

### Stats always show 0

- `CORS_ORIGIN` mismatch → must exactly match frontend URL (`https://…`)
- Check DevTools → Network → response headers include `X-RateLimit-Limit`

### Backend health: `redis: "down"`

- `REDIS_URL` not linked → use `${{Redis.REDIS_URL}}`
- Redis service name differs → adjust reference to match your Redis service name

### Build fails: cannot find `shared/`

- Root Directory must be repo root, not `backend/` or `frontend/`

### Build fails: lightningcss / Tailwind native binding

- Frontend Dockerfile uses `node:20-bookworm-slim` and `npm install --include=optional` — ensure Railway uses the repo Dockerfile, not Railpack

### `server.js` not found

- Standalone output is at `.next/standalone/frontend/` — already handled in `frontend/Dockerfile`

---

## CLI (optional)

```bash
npm i -g @railway/cli
railway login
railway link   # pick project + service when running commands
railway up     # deploy linked service
railway logs
```

Run `railway link` separately for `backend` and `frontend` when deploying from your machine.

---

## Cost

This stack runs three Railway services (Redis + backend + frontend). Monitor usage on the Railway dashboard.
