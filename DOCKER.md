# Docker Setup

Weekly Eats runs as two containers orchestrated by Docker Compose.

## Architecture

```
Tailscale Funnel (port 4400)
  └─► Host port 4400
        └─► Docker: weekly-eats-app (port 3000)
              ├─► Docker: weekly-eats-db / postgres (port 5432, internal DNS)
              └─► Host: Ollama (port 11434, via host.docker.internal)
```

## Containers

| Container | Image | Purpose | Port Mapping |
|-----------|-------|---------|--------------|
| `weekly-eats-app` | Multi-stage (bun build → node:22-alpine) | Next.js production server | 4400 → 3000 |
| `weekly-eats-db` | postgres:17-alpine | PostgreSQL database | 54320 → 5432 |

## Image Build

Three-stage Dockerfile:

1. **deps** (`oven/bun:1-alpine`) — installs dependencies from `bun.lock`
2. **builder** (`oven/bun:1-alpine`) — runs `next build` with `output: "standalone"`, uses `network: host` to reach postgres at `localhost:54320` for static page prerendering
3. **runner** (`node:22-alpine`) — copies only the standalone server, static assets, and public directory. Runs as non-root `nextjs` user. Final image ~106MB compressed.

## Environment Variables

Secrets live in `.env` (git-ignored). See `.env.example` for the template.

At runtime, `docker-compose.yml` overrides two variables for the container network:
- `DATABASE_URL` — uses Docker service name `postgres:5432` (not `localhost:54320`)
- `OLLAMA_BASE_URL` — uses `host.docker.internal:11434` to reach Ollama on the host

The `.env` values for these two are only used during local development (`bun run dev`).

## Commands

```bash
# Build and start everything
docker compose up -d --build

# Rebuild just the app after code changes
docker compose up -d --build app

# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop everything and remove volumes (deletes database!)
docker compose down -v
```

## Database Migrations

Run from the host (not inside the container), since `drizzle-kit` is a dev dependency:

```bash
bun run db:migrate
```

This connects to postgres via `localhost:54320` (the host-mapped port).

## Local Development

Start only postgres in Docker, run Next.js bare on the host:

```bash
docker compose up -d postgres
bun run dev
```

## Cron

The Sunday 8 AM meal plan generator runs inside the app container via `node-cron`, bootstrapped through Next.js `instrumentation.ts`. The container timezone is set to `America/Vancouver` so the cron fires at Pacific time.

## Auto-Restart

Both containers use `restart: unless-stopped`. As long as Docker Desktop is set to launch on login, the app survives reboots without a LaunchAgent.

## Docker Credential Helper

Docker Desktop on macOS stores credentials in the system keychain, which fails in non-interactive sessions (SSH, Claude Code). A no-op credential helper is installed at `/opt/homebrew/bin/docker-credential-none` and configured in `~/.docker/config.json` (`credsStore: "none"`).

This is safe — it just skips authentication, which is fine for pulling public images. The only limitation is Docker Hub's anonymous rate limit (100 pulls per 6 hours), which is a non-issue for personal use.

To restore Docker Hub authentication (e.g., for private images):

```bash
# From an interactive terminal
security unlock-keychain ~/Library/Keychains/login.keychain-db
```

Then in `~/.docker/config.json`, change `"credsStore": "none"` back to `"credsStore": "desktop"`.

## Healthchecks

- **postgres**: `pg_isready` every 5s. App waits for this before starting.
- **app**: `wget` to `/login` every 30s with a 15s startup grace period.
