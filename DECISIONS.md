# Architectural Decisions

## LLM Model: Mistral over Llama 3.1:8b

Mistral produces cleaner JSON output with proper decimal quantities (`0.5` vs `1/2`) and no markdown code fence wrapping. We use Ollama's `format: "json"` parameter as a safety net to guarantee valid JSON from any model.

## Recipe Generation: 5 Separate LLM Calls

Rather than generating all 5 recipes in a single prompt, we make one call per weeknight dinner. This produces higher quality output from 7B parameter models and allows individual retry on failure. Each call includes the already-generated recipes for that week to avoid intra-week duplication.

## Grocery Deduplication: Code-First, LLM-Fallback

Ingredient merging and categorization is done in code (string similarity + unit normalization) rather than via LLM. This is faster and more reliable. The LLM is only used as a fallback for ambiguous items that don't match any known category.

## Auth: Shared Password with JWT Cookie

No user accounts — just a single shared password. On login, a signed JWT cookie is set with 90-day expiry. Rate limited to 5 attempts/min per IP to prevent brute force when exposed via Tailscale Funnel.

## Ports: 4400 (App) and 54320 (Postgres)

Chosen to avoid conflicts with common development ports (3000-3999, 5000-5999, 8000-8999). This machine is used for local development across multiple projects.

## PWA: Built-in Next.js 16 Support

Using `app/manifest.ts` and a manual `public/sw.js` service worker. No third-party PWA package needed — Next.js 16 has native support.

## Grocery List Sync: Server-Sent Events (SSE)

Real-time sync between two users checking off grocery items. SSE is lighter than WebSockets and works with native `EventSource` in browsers. No extra dependencies needed.

## Database: Ingredients as JSONB, Grocery Items as Rows

Recipe ingredients are stored as JSONB arrays to match the LLM output format directly. Grocery items are normalized into individual rows because each needs independent check/uncheck state for the shopping experience.
