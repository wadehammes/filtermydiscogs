## Playlists env override

Playlists are GA — no Vercel **`playlists`** flag or client **`FeatureFlagProvider`** snapshot. [`getPlaylistsFeatureEnabled`](../../src/lib/playlistsFeature.server.ts) defaults to **`true`** and exists for **/admin** readout and local kill-switch testing. **`PLAYLISTS_FEATURE_OVERRIDE=0`** in **`.env.local`** drives the **/admin** kill-switch readout only (playlists UI and APIs remain on).

**E2E:** [`playwright.config.ts`](../../playwright.config.ts) **`webServer.env`** merges [`e2eFeatureFlagEnv.ts`](../../src/tests/e2eFeatureFlagEnv.ts). Browser **`fetch`** for **`/api/playlists`** is still mocked by MSW ([`handlers/playlists.ts`](../../src/tests/msw/handlers/playlists.ts)).

[`next.config.ts`](../../next.config.ts) **`env`** block exposes **`DISCOGS_CONSUMER_KEY`**, **`DISCOGS_CALLBACK_URL`**, build/version flags, and **`NEXT_PUBLIC_SENTRY_ENABLE_DEV`** (mirrored from **`SENTRY_ENABLE_DEV`** when unset) to the Next bundle. **`DISCOGS_CONSUMER_SECRET`** stays a runtime server env var (used by [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) only). Do not add server-only secrets to **`env`**.

Local values: **`.env.local`** (gitignored). See root [README.md](../../README.md) for setup steps.

