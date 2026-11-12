# API routes (agent map)

How **App Router** APIs are organized for agents: **auth tiers**, the **`api.*` client**, and where to look for validation and errors. Behavioral detail for crate/playlist/Prisma routes remains in [database.md → API routes](database.md#api-routes).

## Auth tiers

| Tier | Helper | Typical routes |
| ---- | ------ | -------------- |
| **Public read** | None or IP rate limit only | `GET /api/crates/public/[id]`, `GET /api/playlists/public/[id]`, `GET /api/build-version`, public OG routes |
| **Optional session** | `getOptionalVerifiedUserFromRequest` | `POST /api/usage/events`, some playlist engagement (`/view`, `/play`) |
| **Verified Discogs session** | `getVerifiedUserFromRequest` / **`getVerifiedUserFromRequestWithRateLimit`** | Crate/playlist mutations, prefs, release proxy, dashboard, tracks |
| **Admin** | `verifyAdminFromRequest` (`ADMIN_USER_ID`) | `/api/admin/*`, `GET /api/crates/health` |
| **Cron / secret** | `Authorization: Bearer CRON_SECRET` | `GET /api/cron/product-analytics` |

Mutating crate and playlist handlers scope data by **`identity.id`** from verified OAuth—never by the **`discogs_user_id`** cookie alone ([database.md](database.md)).

## Client integration: `api.*` → handler

Browser code should call **[`api`](../../src/api/urls.ts)** only; implementations live in [`src/api/endpoints/`](../../src/api/endpoints/).

| `api` method | HTTP route (summary) |
| ------------ | -------------------- |
| `checkAuth`, `logout`, `clearData` | `/api/auth/check`, `/api/auth/logout`, `/api/auth/clear-data` |
| `discogsCollection`, `collectionFields`, `collectionValue`, `updateCollectionNote`, `updateReleaseRating`, `clearReleaseRating` | `/api/collection/*` |
| `discogsRelease`, `discogsReleaseBatch`, `discogsSearch` | `/api/release/[id]`, `/api/release/batch`, `/api/search` |
| `crates`, `crate`, `createCrate`, `updateCrate`, `deleteCrate`, `addReleaseToCrate`, `removeReleaseFromCrate`, `updateCrateLayout`, `syncCrates`, `migrateLegacyCrate`, `publicCrate`, `releaseCrateMembership`, `setReleaseCrateMembership`, `setReleasePackedInCrate`, `clearAllPackedInCrate` | `/api/crates/*` |
| `playlists`, `playlist`, `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addTrackToPlaylist`, `removeTrackFromPlaylist`, `reorderPlaylistTracks`, `publicPlaylist`, `recordPublicPlaylistView`, `recordPublicPlaylistPlay`, `votePublicPlaylistTrack` | `/api/playlists/*` |
| `userPreferences`, `updateUserPreferences`, `dismissSupportProjectToast` | `/api/user/preferences`, `/api/user/support-toast/dismiss` |
| `recordTrackEvent`, `fetchTrackStats`, `saveTrackYoutubeOverride`, `fetchYoutubeOembed` | `/api/tracks/*`, `/api/youtube/oembed` |
| `mostCratedReleases`, `topUserTracks` | `/api/dashboard/*` |
| `adminStats`, `adminUserLookup` | `/api/admin/*` |
| `buildVersion` | `/api/build-version` |

When you add a **`api.newMethod`**, add the endpoint module, wire it in **`urls.ts`**, add a route under `src/app/api/`, Zod schema if needed, and update [database.md](database.md) (or this table) in the same PR.

## Routes without a `api.*` wrapper

These are used via **navigation**, **`<form action>`**, **Stripe redirect**, or **server-only** fetch—not via `src/api/urls.ts`.

| Route | Role |
| ----- | ---- |
| `/api/auth/discogs`, `/api/auth/callback` | OAuth 1.0a redirect dance |
| `/api/image-proxy` | Mosaic / avatar image proxy (rate-limited) |
| `/api/donate/checkout` | Stripe checkout session |
| `/api/cron/product-analytics` | Vercel Cron rollup |
| `/api/og/crate/[id]`, `/api/og/playlist/[id]` | OG image generation |

Auth flow details: [discogs.md](discogs.md).

## Validation and errors

- **Schemas:** [`src/lib/validation/*.ts`](../../src/lib/validation/) — extend existing schemas; see [database.md → Request validation](database.md#api-routes).
- **Bodies:** [`parseRequestBody`](../../src/lib/validation/parseRequestBody.ts) in routes where the handbook already uses it.
- **Private JSON:** [`privateRouteJson`](../../src/lib/private-route-response.ts) for authenticated session API responses ([platform.md → Private session API responses](platform.md)).
- **Errors:** [`sanitizeError`](../../src/lib/api-helpers.ts) + Prisma helpers — co-located specs under `src/lib/*.spec.ts`.

## Rate limits (defaults)

Per-IP and per-user limits are env-tunable; see [platform.md → Environment variables](platform.md) (`IP_RATE_LIMIT_*`, `DB_RATE_LIMIT_*`, `AUTH_ROUTE_RATE_LIMIT_*`, etc.).

## Testing routes

- Prefer **co-located `route.spec.ts`** next to `route.ts`.
- Mock server libs (`fetchDiscogsReleaseRecord`, playlist/crate server modules) — not the route’s internal imports via `jest.requireActual` spreading ([conventions.md](conventions.md)).
