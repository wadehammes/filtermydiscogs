## Release detail and in-app playback

Full release metadata (tracklist, community videos) is **not** included in collection pagination. The app fetches it on demand when a release detail modal opens.

| Operation           | App route                      | Discogs API                  |
| ------------------- | ------------------------------ | ---------------------------- |
| Read release detail | `GET /api/release/{releaseId}` | `GET /releases/{release_id}` |

Authenticated sessions use the user's OAuth tokens. When OAuth **`GET /releases/{id}`** returns **404** (Discogs sometimes responds _“That release does not exist…”_ for a valid release id), [`fetchDiscogsReleaseRecord.server.ts`](../../src/lib/fetchDiscogsReleaseRecord.server.ts) retries once with application (consumer) credentials before the app proxy returns **404** — same helper for **`GET /api/release/[id]`** and **`POST /api/release/batch`**. Visitors without Discogs cookies — and browsers that still hold OAuth token cookies after logout (**`discogs_session`** cleared, tokens preserved for quick re-login) — use consumer credentials directly so public crate pages can open the release modal and mini player.

Client helper: **`api.discogsRelease`** in [`src/api/urls.ts`](../../src/api/urls.ts). React Query: **`useDiscogsReleaseQuery`** ([`src/hooks/queries/useDiscogsReleaseQuery.ts`](../../src/hooks/queries/useDiscogsReleaseQuery.ts)) with **`DiscogsReleaseQueryKeys`**.

**Testing:** Assert the route contract in [`route.spec.ts`](../../src/app/api/release/[id]/route.spec.ts) (search **`when OAuth returns 404 but consumer credentials resolve the release`**, **`returns 404 when Discogs reports the release is missing for OAuth and consumer`**) and [`release/batch/route.spec.ts`](../../src/app/api/release/batch/route.spec.ts); OAuth **404** → consumer logic in [`fetchDiscogsReleaseRecord.server.spec.ts`](../../src/lib/fetchDiscogsReleaseRecord.server.spec.ts). Client helper: [`helpers.spec.ts`](../../src/api/helpers.spec.ts). Rating writes: [`collection/releases/[releaseId]/rating/route.spec.ts`](../../src/app/api/collection/releases/[releaseId]/rating/route.spec.ts) and [`collection.rating.spec.ts`](../../src/api/endpoints/collection.rating.spec.ts). UI tests mock **`api.discogsRelease`** via **`src/api/urls`** and let **`useDiscogsReleaseQuery`** run on **`TestProviders`** (see [conventions.md → Testing](conventions.md#testing)).

Typed response fields live in [`src/types/discogs-release-detail.types.ts`](../../src/types/discogs-release-detail.types.ts): **`tracklist`** (position, title, duration, nested **`sub_tracks`**, per-track **`artists`** and **`extraartists`**), **`videos`** (YouTube **`uri`**, **`title`**, **`embed`**), **`community.rating`** (Discogs average **`average`** and **`count`**), **`images`** (full cover CDN URLs on **`uri`**, plus smaller **`uri150`** previews).

**Cover art URLs:** Resolve full covers with **`resolveDiscogsReleaseDetailCoverUri`** ([`discogsReleaseArt.ts`](../../src/utils/discogsReleaseArt.ts)): prefer **`images`** where **`type`** is **`primary`**, then any other image **`uri`** — not **`uri150`** or release-level **`thumb`** until no full **`uri`** exists (**`thumb`** / collection **`basic_information.thumb`** stay fallbacks for cards and snapshots without detail).

