# Data storage and privacy alignment

Where user and session data lives, what **Delete account** ( **`POST /api/auth/clear-data`** ) removes, and which **user-facing copy** must stay aligned when storage behavior changes. Agents changing persistence or auth should read this **before** editing code.

## Storage map

| Layer | Location | What it holds |
| ----- | -------- | ------------- |
| **Postgres (Prisma)** | `User`, crates, playlists, `UserTrack` | Durable account data scoped by Discogs identity; **`User.preferences`** JSON (theme, **`squareCorners`**, view, filters, playback toggles, etc. — see [patterns.md → Settings](patterns.md#settings)) |
| **OAuth cookies** | HttpOnly session cookies (see [discogs.md](discogs.md)) | Discogs session; verified on API routes |
| **localStorage** | Keys in [`storageKeys.ts`](../../src/constants/storageKeys.ts) | Theme, filters, view, analytics consent, table layout, legacy keys |
| **sessionStorage** | [`SIMILAR_PAGE_INDEX_SESSION_KEY`](../../src/constants/storageKeys.ts) (`fmd:similar-page-index-by-anchor`) | JSON map of release-modal anchor **`instance_id`** → similar sidebar page index; cleared on modal **`handleCloseModal`**, **`clearClientStoredData`**, and full client clear; Playwright **`installClearClientStorage`** may preserve this key across navigations |
| **IndexedDB** | [`COLLECTION_CACHE_DB_NAME`](../../src/constants/storageKeys.ts) | Collection cache for faster re-login ([`CollectionCachePrepGate`](../../src/components/CollectionCachePrepGate/CollectionCachePrepGate.component.tsx)) |
| **Legacy local crate** | Pre-migration localStorage (see crate migration) | Migrated via **`POST /api/crates/migrate`** |

### Common `localStorage` keys

Defined in [`src/constants/storageKeys.ts`](../../src/constants/storageKeys.ts): **`filtermydiscogs_filters`**, **`filtermydiscogs_view_state`**, **`filtermydiscogs_theme`**, **`filtermydiscogs_analytics_consent`**, **`filtermydiscogs_selected_releases`**, **`filtermydiscogs_playback_dock_bar_collapsed`** (hidden mini-player bar — **[`playbackDockBarCollapsedAtom`](../../src/atoms/playbackDockUi.atoms.ts)**), collection item counts, releases table layout, etc. Per-user keys include **`buildEmailAccountToastDismissedStorageKey(userId)`** (`fmd_email_account_toast_dismissed_<userId>`) for the Account email capture toast and **`buildWhatsNewLastSeenStorageKey(userId)`** (`fmd_whats_new_last_seen_<userId>`) for the What's New modal last-seen version string ([`whatsNewLastSeen.ts`](../../src/utils/whatsNewLastSeen.ts)). Prefer extending this module over new ad-hoc key strings.

## Server: delete account (`clear-data` API)

**`POST /api/auth/clear-data`** (client: **`api.clearData`**):

1. Deletes the **`User`** row (cascades crates, playlists, and **`user_tracks`** per schema).
2. Clears session cookies.

Implementation and tests: [`src/app/api/auth/clear-data/route.ts`](../../src/app/api/auth/clear-data/route.ts). Client orchestration: [`useClearAllUserData`](../../src/hooks/useClearAllUserData.hook.ts).

## When storage code changes — copy checklist

If you change **what** is stored, **where**, or **what clear-data removes**, verify or update user-facing policy text in the same PR:

| Code area | User-facing surfaces |
| --------- | --------------------- |
| [`storageKeys.ts`](../../src/constants/storageKeys.ts), filter/view persistence | Settings, cookie consent if applicable |
| [`useClearAllUserData`](../../src/hooks/useClearAllUserData.hook.ts), clear-data API | [`AboutClient`](../../src/components/About/AboutClient.component.tsx), [`LegalPageContent`](../../src/components/Legal/LegalPageContent.server.tsx), Settings confirm copy |
| Prisma schema / preferences API | [patterns.md → Delete account](patterns.md#delete-account-clear-data-api), Settings |
| Analytics consent keys | [`CookieConsentBanner`](../../src/components/CookieConsentBanner/), Legal |

Cursor **`stop`** hook **`stop_section_terms_privacy`** nudges when storage-related **`src/`** files change without About/Legal updates (see [`.cursor/hooks/README.md`](../../.cursor/hooks/README.md)).

## Related chapters

- Preferences sync: [patterns.md](patterns.md), **`POST /api/user/preferences`**
- Discogs collection (not in our DB): [discogs.md](discogs.md)
- Full route behavior: [database.md](database.md)
