# Data storage and privacy alignment

Where user and session data lives, what **Clear all data** removes, and which **user-facing copy** must stay aligned when storage behavior changes. Agents changing persistence or auth should read this **before** editing code.

## Storage map

| Layer | Location | What it holds |
| ----- | -------- | ------------- |
| **Postgres (Prisma)** | `User`, crates, playlists, `UserTrack`, analytics events | Durable account data scoped by Discogs identity |
| **OAuth cookies** | HttpOnly session cookies (see [discogs.md](discogs.md)) | Discogs session; verified on API routes |
| **localStorage** | Keys in [`storageKeys.ts`](../../src/constants/storageKeys.ts) | Theme, filters, view, analytics consent, table layout, legacy keys |
| **IndexedDB** | [`COLLECTION_CACHE_DB_NAME`](../../src/constants/storageKeys.ts) | Collection cache for faster re-login ([`CollectionCachePrepGate`](../../src/components/CollectionCachePrepGate/CollectionCachePrepGate.component.tsx)) |
| **Legacy local crate** | Pre-migration localStorage (see crate migration) | Migrated via **`POST /api/crates/migrate`** |

### Common `localStorage` keys

Defined in [`src/constants/storageKeys.ts`](../../src/constants/storageKeys.ts): **`filtermydiscogs_filters`**, **`filtermydiscogs_view_state`**, **`filtermydiscogs_theme`**, **`filtermydiscogs_analytics_consent`**, **`filtermydiscogs_selected_releases`**, collection item counts, releases table layout, etc. Prefer extending this module over new ad-hoc key strings.

## Server: clear all data

**`POST /api/auth/clear-data`** (client: **`api.clearData`**):

1. Deletes **`product_analytics_events`** for the user.
2. Deletes the **`User`** row (cascades crates/playlists-related data per schema).
3. Clears session cookies.

Implementation and tests: [`src/app/api/auth/clear-data/route.ts`](../../src/app/api/auth/clear-data/route.ts). Client orchestration: [`useClearAllUserData`](../../src/hooks/useClearAllUserData.hook.ts).

## When storage code changes — copy checklist

If you change **what** is stored, **where**, or **what clear-data removes**, verify or update user-facing policy text in the same PR:

| Code area | User-facing surfaces |
| --------- | --------------------- |
| [`storageKeys.ts`](../../src/constants/storageKeys.ts), filter/view persistence | Settings, cookie consent if applicable |
| [`useClearAllUserData`](../../src/hooks/useClearAllUserData.hook.ts), clear-data API | [`AboutClient`](../../src/components/About/AboutClient.component.tsx), [`LegalPageContent`](../../src/components/Legal/LegalPageContent.server.tsx), Settings confirm copy |
| Prisma schema / preferences API | [patterns.md → Clear stored data](patterns.md), Settings |
| Analytics consent keys | [`CookieConsentBanner`](../../src/components/CookieConsentBanner/), Legal |

Cursor **`stop`** hook **`stop_section_terms_privacy`** nudges when storage-related **`src/`** files change without About/Legal updates (see [`.cursor/hooks/README.md`](../../.cursor/hooks/README.md)).

## Related chapters

- Preferences sync: [patterns.md](patterns.md), **`POST /api/user/preferences`**
- Discogs collection (not in our DB): [discogs.md](discogs.md)
- Full route behavior: [database.md](database.md)
