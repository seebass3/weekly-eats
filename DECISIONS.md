# Architectural Decisions

## LLM Model: gemma3:4b

Switched from Mistral 7B to Google's Gemma 3 4B. Gemma 3 is ~2x faster on Apple Silicon M4 (smaller model, better architecture), produces clean JSON with `format: "json"`, and handles structured output well. Evaluated qwen3:4b but its thinking mode conflicts with JSON-constrained output (empty responses). Gemma 3 4B hits the sweet spot of speed (~75s for 5 full recipes) and quality.

## Recipe Generation: Batch All 5 in One LLM Call

All 5 weeknight recipes are generated in a single LLM call using `buildWeekPlanPrompt()` + `WeekPlanSchema`. This is ~2x faster than 5 sequential calls. The vegetarian/meat split (Mon/Wed vegetarian, Tue/Thu/Fri meat) is enforced per-recipe in the prompt. Single recipe swaps still use individual calls via `regenerateSingleRecipe()` for fast ~15s swaps.

## Grocery Deduplication: Code-First, LLM-Fallback

Ingredient merging and categorization is done in code (string similarity + unit normalization) rather than via LLM. This is faster and more reliable. The LLM is only used as a fallback for ambiguous items that don't match any known category.

## Auth: Shared Password with JWT Cookie

No user accounts — just a single shared password. On login, a signed JWT cookie is set with 90-day expiry. Rate limited to 5 attempts/min per IP to prevent brute force when exposed via Tailscale Funnel.

## Ports: 4400 (App) and 54320 (Postgres)

Chosen to avoid conflicts with common development ports (3000-3999, 5000-5999, 8000-8999). This machine is used for local development across multiple projects.

## PWA: Built-in Next.js 16 Support

Using `app/manifest.ts` and a manual `public/sw.js` service worker. No third-party PWA package needed — Next.js 16 has native support.

## Real-Time Sync: Unified SSE Event Bus

All mutations (grocery, meals, favorites) emit events through a single in-memory pub/sub (`src/lib/sync-events.ts`) streamed via one SSE endpoint (`/api/sync/events`). A `SyncProvider` in the root layout subscribes and calls `router.refresh()` for non-grocery events (meals, favorites), triggering RSC re-renders with fresh cached data. Grocery events are forwarded to `GroceryListView` for granular optimistic updates. The listener set uses `globalThis` to survive module reloads in dev mode. SSE chosen over WebSockets for simplicity — lighter, native `EventSource` support, no extra dependencies.

## Mutations: Server Actions with updateTag

Quick mutations (toggle/remove/clear grocery items, toggle favorites) use server actions (`src/lib/actions.ts`) with `updateTag()` for immediate cache invalidation. Long-running operations (generate week, swap recipe) stay as API route handlers with `revalidateTag(tag, { expire: 0 })` since they need client-side loading state management. SSE handles cross-tab real-time sync for grocery operations.

## Caching: Next.js 16 use cache + cacheComponents

Read queries use `"use cache"` directive with `cacheTag()` for automatic server-side caching. `cacheComponents: true` in next.config.ts enables component-level caching. Server actions call `updateTag()` to invalidate, route handlers call `revalidateTag()`. Dynamic client components (`usePathname`, etc.) are wrapped in `<Suspense>` boundaries as required by cacheComponents mode.

## Date Handling: Local Timezone

Week dates use local timezone formatting (`getFullYear/getMonth/getDate`) instead of `toISOString()` which uses UTC. In Vancouver (UTC-8), Monday evening local time is Tuesday in UTC, causing week starts to land on Tuesdays. Shared utilities in `src/lib/dates.ts`.

## Diet Split: Vegetarian Mon/Wed, Meat Tue/Thu/Fri

2 vegetarian + 3 meat meals per week. Enforced in the batch prompt with explicit per-recipe constraints rather than a general instruction, since smaller models (4B) sometimes ignore general dietary rules.

## Database: Ingredients as JSONB, Grocery Items as Rows

Recipe ingredients are stored as JSONB arrays to match the LLM output format directly. Grocery items are normalized into individual rows because each needs independent check/uncheck state for the shopping experience.

## Tailscale Funnel Setup (Manual)

When ready to expose the app to your partner:

```bash
# Enable Funnel on port 4400
tailscale funnel --bg 4400

# Verify it's running
tailscale funnel status

# The app will be accessible at:
# https://claudes-computer.<tailnet>.ts.net
```

To disable Funnel:
```bash
tailscale funnel --bg --remove 4400
```

## Drag-and-Drop Reorder: @dnd-kit with Day Swap

Recipe cards on the meals page can be dragged to reorder which day each recipe is assigned to. Dragging swaps the `dayOfWeek` values of the two recipes — no `sortOrder` column needed since each recipe has a unique weekday slot. Uses `@dnd-kit/core` + `@dnd-kit/sortable` (chosen for React 19 compatibility; `react-beautiful-dnd` is archived). A `GripVertical` handle on the left of each card initiates drag, avoiding conflicts with the card's Link navigation and swap button. `TouchSensor` uses a 200ms activation delay to prevent conflicts with scrolling. `restrictToVerticalAxis` modifier keeps drag constrained. Optimistic UI updates local state immediately with rollback on server error.

## Docker Containerization

The app runs in a Docker container for production instead of bare `bun run start`. Multi-stage Dockerfile: `oven/bun:1-alpine` for dependency install and build, `node:22-alpine` for runtime (standalone output produces a Node.js server script). The container runs as a non-root `nextjs` user.

Network topology: Postgres is reached via Docker internal DNS (`postgres:5432`), Ollama on the host via `host.docker.internal:11434`. Tailscale remains at the OS level, funneling host port 4400 which maps to container port 3000. `DATABASE_URL` is constructed in `docker-compose.yml` using the service name — not read from `.env`.

The `node-cron` scheduler (bootstrapped via `instrumentation.ts`) works in standalone mode since it's bundled into `server.js`. Container timezone is set to `America/Vancouver` so the Sunday 8 AM cron fires at Pacific time.

Auto-restart is handled by Docker's `restart: unless-stopped` policy — no LaunchAgent needed as long as Docker Desktop is set to start on login.

```bash
# Build and start
docker compose up -d --build

# Rebuild after code changes
docker compose up -d --build app

# Logs
docker compose logs -f app

# DB migrations (from host, where drizzle-kit is available)
bun run db:migrate

# Local dev (unchanged)
docker compose up -d postgres
bun run dev
```
