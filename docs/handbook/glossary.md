# Glossary

Domain and internal terms agents see in code, copy, and API payloads. Paths are under **`src/`** unless noted.

## Discogs collection

| Term | Meaning |
| ---- | ------- |
| **Release** | A Discogs catalog release (master or variant). UI cards and modal use Discogs release JSON from **`/api/release/[id]`** or batch. |
| **Instance** | One copy of a release in *your* collection — identified by **`instance_id`** (integer). Crate membership and “add to crate” operate on instances, not bare release ids. |
| **`instance_id`** | Stable collection row id from Discogs pagination. Used in crate APIs, membership PUT, and collection UI keys. |
| **`release_id`** | Discogs catalog id (string/numeric). Used for release detail, search, and batch fetch — distinct from **`instance_id`**. |
| **Rating / notes** | Per-instance collection fields; note writes go through collection API routes ([`discogs.md`](discogs.md)). |

## Tracks and playback

| Term | Meaning |
| ---- | ------- |
| **`track_key`** | App-stable key for a track on a release (position + identifiers). Used for **`UserTrack`** stats, playlist rows, YouTube overrides, and **`GET /api/tracks/stats`**. |
| **Play vs listen** | Analytics events on **`POST /api/tracks/record`**: **`play`** (transport start) vs **`listen`** (sustained engagement threshold). |
| **YouTube override** | Per-**`track_key`** embed id in Postgres (`PATCH /api/tracks/youtube`); overrides Discogs video pick for the dock/modal. |
| **Queue / upcoming queue** | Playback session state in **`ReleasePlaybackProvider`** — manual adds, similar-tail extension, album rebuild. See [playback-manual-queue.md](playback-manual-queue.md). |
| **Similar tail** | Optional queue extension with collection-matched releases; batch **`POST /api/release/batch`**. |

## Crates and playlists

| Term | Meaning |
| ---- | ------- |
| **Crate (owner)** | User-owned curated list in Postgres (`Crate` + `CrateRelease`). Hub at **`/crates`**, detail **`/crates/[id]`**. |
| **Public crate** | Crate with **`private: false`** — share URL **`/crate/[id]`** (uuid), read-only payload stripped of private fields. |
| **Owner route vs share route** | **`/crates/[id]`** (auth, layout DnD) vs **`/crate/[id]`** (public SSR). Do not conflate path prefixes. |
| **Packed** | Release marked found/packed in a crate (`setReleasePackedInCrate`, bulk clear). |
| **Layout / markers** | Section structure on a crate (`PUT /api/crates/[id]/layout`, `CrateSetMarker`). |
| **Playlist** | Cross-release ordered **`track_key`** list (`UserTrack` junction). Feature-flagged (**`playlists`**). Public share **`/playlist/[id]`**. |
| **Legacy crate migrate** | One-time import from old **localStorage** into default crate — **`POST /api/crates/migrate`**. |

## Auth and session

| Term | Meaning |
| ---- | ------- |
| **Verified session** | OAuth tokens validated on the server; API routes use **`getVerifiedUserFromRequest*`** and **`identity.id`**. |
| **`discogs_user_id` cookie** | Client-readable id hint — **not** sufficient alone to authorize mutations. |
| **Soft logout / reconnect** | Logout keeps tokens for fast re-login; **`reconnectUsername`** + collection cache prep ([`resolveCollectionCacheUsername`](../../src/utils/resolveCollectionCacheUsername.ts)). |
| **Clear stored data** | Deletes **`User`** row + analytics + cookies; wipes client prefs (see [data-storage.md](data-storage.md)). |

## Client state (short)

| Term | Meaning |
| ---- | ------- |
| **Session filters** | In-memory filter UI state (**`sessionFiltersAtom`**); may diverge from saved prefs until user applies. |
| **Saved filter views** | Named snapshots on **`User.preferences`** — synced via **`PATCH /api/user/preferences`**. |
| **Collection cache** | IndexedDB cache of collection pages for faster re-login ([`COLLECTION_CACHE_DB_NAME`](../../src/constants/storageKeys.ts)). |

## Ops and tooling

| Term | Meaning |
| ---- | ------- |
| **`staging`** | Default integration branch; PRs target **`staging`**, not **`main`**. |
| **`privateRouteJson`** | Standard JSON helper for authenticated API responses ([`private-route-response.ts`](../../src/lib/private-route-response.ts)). |
| **PO (page object)** | **`.po.tsx`** — mocks and render helpers only; specs call PO methods ([conventions.md](conventions.md)). |

For pattern choices, see [decisions.md](decisions.md). For route auth, see [api-routes.md](api-routes.md).
