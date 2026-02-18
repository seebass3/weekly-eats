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

## macOS LaunchAgent (Auto-Start)

To ensure the app starts on boot, create `~/Library/LaunchAgents/com.weekly-eats.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.weekly-eats</string>
    <key>WorkingDirectory</key>
    <string>/Users/cc/Developer/local-apps/weekly-eats</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/bun</string>
        <string>run</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/weekly-eats.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/weekly-eats.error.log</string>
</dict>
</plist>
```

Then load it: `launchctl load ~/Library/LaunchAgents/com.weekly-eats.plist`
