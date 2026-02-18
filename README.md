# Weekly Eats

A self-hosted weekly dinner planner powered by local AI. Generates 5 weeknight recipes every Sunday, builds a consolidated grocery list, and lets you swap or reorder meals throughout the week.

Runs entirely on your own hardware — no cloud APIs, no subscriptions.

## Features

- **AI meal planning** — Generates 5 dinner recipes (2 vegetarian Mon/Wed, 3 meat Tue/Thu/Fri) using a local LLM via Ollama
- **Grocery list** — Auto-generated from recipe ingredients with deduplication and categorization
- **Recipe swapping** — Replace any recipe with a favorite or generate a new one with optional context (e.g. "use up lemons")
- **Drag-and-drop reorder** — Drag recipe cards to reassign days
- **Favorites** — Save and reuse recipes you like
- **Real-time sync** — Changes sync across tabs/devices via SSE
- **PWA** — Installable on mobile with offline shell support
- **Shared access** — Password-protected, accessible over Tailscale

## Tech Stack

- **Next.js 16** (App Router, `use cache`, React 19)
- **Drizzle ORM** + **PostgreSQL** for persistence
- **Ollama** with Gemma 3 4B for local LLM inference
- **shadcn/ui** + **Tailwind CSS v4** for UI
- **Docker** for production deployment
- **Bun** for package management and dev scripts

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine)
- [Ollama](https://ollama.com/) with a model pulled (default: `gemma3:4b`)
- [Bun](https://bun.sh/) (for local development and DB migrations)

## Setup

1. **Clone and configure:**

   ```bash
   cd weekly-eats
   cp .env.example .env
   ```

   Fill in `.env`:
   - `POSTGRES_PASSWORD` — any secure password
   - `APP_PASSWORD` — password to log into the app
   - `SESSION_SECRET` — random string for JWT signing (e.g. `openssl rand -hex 32`)
   - `CRON_SECRET` — random string for cron endpoint auth

2. **Pull the Ollama model:**

   ```bash
   ollama pull gemma3:4b
   ```

3. **Start the database and run migrations:**

   ```bash
   docker compose up -d postgres
   bun install
   bun run db:migrate
   ```

4. **Start the app:**

   ```bash
   # Production (Docker)
   docker compose up -d --build

   # Development
   bun run dev
   ```

   The app is available at `http://localhost:4400` (production) or `http://localhost:4401` (dev).

## Common Commands

```bash
# Rebuild after code changes
docker compose up -d --build app

# View logs
docker compose logs -f app

# Run DB migrations
bun run db:migrate

# Open Drizzle Studio (DB browser)
bun run db:studio
```

## Architecture

See [DECISIONS.md](./DECISIONS.md) for detailed architectural decisions covering LLM model choice, caching strategy, auth, real-time sync, and more.

### Key directories

```
src/
  app/           # Next.js routes (meals, grocery, favorites, recipes)
  components/    # React components (meal cards, grocery list, swap drawer, etc.)
  hooks/         # Custom hooks (animated list)
  lib/
    actions.ts   # Server actions for mutations
    db/          # Drizzle schema, queries, migrations
    ollama/      # LLM client, prompts, generation logic
    sync-events.ts  # SSE pub/sub for real-time sync
```

## License

Private — personal use only.
