# Discogs integration

OAuth 1.0a authentication, API access, username validation, and cookie conventions.

## OAuth flow

Implemented in [`src/services/discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) using **`oauth-1.0a`** and Node **`crypto`** for HMAC-SHA1 signing.

| Step | Route / method | Purpose |
|------|----------------|---------|
| 1 | `GET /api/auth/discogs` | Obtain request token, redirect to Discogs authorize |
| 2 | Discogs redirects to callback | User approves app |
| 3 | `GET /api/auth/callback` | Exchange for access token, fetch identity, set cookies, upsert **`User`** row |
| 4 | `GET /api/auth/check` | Verify tokens still valid |
| 5 | `POST /api/auth/logout` | Clear session cookies |
| 6 | `POST /api/auth/clear-data` | Delete **`product_analytics_events`** for the user, delete **`User`** row (cascades crates), and clear session (Settings / About / Legal) |

Temporary OAuth request tokens use short-lived cookies (`oauth_token`, `oauth_token_secret`) cleared after callback.

## Environment variables

| Variable | Where used |
|----------|------------|
| `DISCOGS_CONSUMER_KEY` | OAuth consumer key (server + exposed via `next.config` `env`) |
| `DISCOGS_CONSUMER_SECRET` | OAuth consumer secret (server only in practice) |
| `DISCOGS_CALLBACK_URL` | OAuth callback (default `http://localhost:6767/api/auth/callback`) |
| `DISCOGS_API_USER_AGENT` | Optional override for Discogs API `User-Agent` header |

Register the callback URL in the [Discogs developer app](https://www.discogs.com/settings/developers) for each environment.

## Session cookies

Set in [`src/app/api/auth/callback/route.ts`](../../src/app/api/auth/callback/route.ts):

| Cookie | httpOnly | Purpose |
|--------|----------|---------|
| `discogs_reconnect_username` | no | Last connected Discogs username for quick re-login after logout; display only |
| `discogs_session` | yes | Active app session; cleared on logout while OAuth tokens may remain for quick re-login |
| `discogs_access_token` | yes | OAuth access token |
| `discogs_access_token_secret` | yes | OAuth access token secret |
| `discogs_username` | no | Display name; readable by client JS |
| `discogs_user_id` | yes | Numeric Discogs user ID; display/cache only—**never** used for API authorization |

`secure` is **`false` in development**, **`true` in production**. Max age: 30 days.

Client reads username via [`getUsernameFromCookies`](../../src/services/auth.service.ts) (`js-cookie`). User ID comes from [`/api/auth/check`](../../src/app/api/auth/check/route.ts) (verified OAuth identity) and is stored in [`AuthProvider`](../../src/context/auth.context.tsx)—not from a client-readable cookie. Access tokens are **never** exposed to client JS.

## Authenticated API routes

Route handlers that proxy Discogs (e.g. **`/api/collection`**, **`/api/collection/fields`**, **`/api/collection/instances/{instanceId}/fields/{fieldId}`**, **`/api/collection/releases/{releaseId}/rating`**, **`/api/collection/value`**, **`/api/search`**) must:

1. Verify the session with **`requireAuthenticatedDiscogsUser`** or **`getVerifiedUserFromRequest`** ([`src/lib/auth-request.ts`](../../src/lib/auth-request.ts))—never trust **`discogs_user_id`** or **`discogs_username`** cookies for authorization.
2. Validate the **`username`** query/body param with **`isValidDiscogsUsername`** ([`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts)).
3. Confirm the verified identity username matches the requested username (**case-insensitive** for collection routes).
4. Call **`discogsOAuthService`** methods with token + secret.

Collection route: [`src/app/api/collection/route.ts`](../../src/app/api/collection/route.ts).

## Username validation

Discogs allows letters, numbers, **underscore**, **hyphen**, and **period** in usernames ([Discogs support docs](https://support.discogs.com/hc/en-us/articles/360007423893)).

Use the shared helper everywhere usernames are validated on the server:

```typescript
import { isValidDiscogsUsername } from "src/lib/discogs-username";

if (!isValidDiscogsUsername(username)) {
  return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
}
```

Do **not** copy a narrower regex (e.g. omitting `.`) into individual routes.

## Discogs API service

[`DiscogsOAuthService`](../../src/services/discogs-oauth.service.ts) centralizes:

- OAuth header generation
- **`getIdentity`**, **`getCollection`**, **`getCollectionFields`**, **`updateCollectionInstanceField`**, **`api.updateReleaseRating`**, **`deleteReleaseRating`**, **`getCollectionValue`**, **`search`**, release fetches
- Error handling for HTTP failures (including mapping upstream 5xx to clearer client responses where implemented)
- **Empty success bodies**: Discogs often returns **`204 No Content`** (or an empty body) for successful field writes. **`makeAuthenticatedRequest`** treats **`204`/`205`** and empty bodies as success—do not call **`response.json()`** on those responses.

All Discogs HTTP calls include a **`User-Agent`** identifying the app (required by Discogs API terms).

## Rate limits and errors

Discogs may return **429** (rate limit) or **5xx** (upstream errors). Route handlers should return appropriate status codes and messages; clients surface errors via React Query / context error state.

**OAuth identity lookups** (`getVerifiedUserFromRequest` in [`src/lib/auth-request.ts`](../../src/lib/auth-request.ts)) are cached in memory for a short TTL ([`src/lib/identity-cache.ts`](../../src/lib/identity-cache.ts)) so `/api/auth/check` and crate routes do not call `oauth/identity` on every request. Concurrent lookups for the same token pair share one in-flight request. On Discogs **429**, data routes reuse only a recently cached identity keyed to the current OAuth token pair; they **never** fall back to `discogs_user_id` / `discogs_username` cookies. **`/api/auth/check`** alone may return a display-only identity from those cookies with **`rateLimited: true`**; the client blocks collection and crate fetches until verification succeeds.

**Read-only Discogs proxies** (`GET /api/collection`, `/api/collection/fields`, `/api/collection/value`, `/api/search`, authenticated `/api/release/[id]`) use **`requireReadOnlyDiscogsUser`** / **`getReadOnlyVerifiedUserFromRequest`** so a verified identity cached within the stale window (default 30 minutes) is reused during long collection pagination without re-calling `oauth/identity` on every page. When the in-memory cache is cold (new serverless instance), read-only routes may reuse **`discogs_user_id`** / **`discogs_username`** session cookies set at login so pagination stays one Discogs call per page; cookie-derived identity is **not** written into the OAuth token cache. OAuth tokens are still required and Discogs validates them on the data request. Write routes and `/api/auth/check` keep the default fresh verification policy and never authorize from display cookies alone.

**Auth route rate limits:** [`enforceAuthRouteIpRateLimit`](../../src/lib/auth-route-guards.ts) applies per-IP limits to all **`/api/auth/*`** handlers (default **60** requests / 60s via **`AUTH_ROUTE_RATE_LIMIT_*`**). **`GET /api/crates/public/[id]`** uses **`PUBLIC_CRATE_RATE_LIMIT_*`** (default **120** / 60s). Limits are in-memory per serverless instance; pair with Vercel WAF rules for global abuse if needed.

**Discogs request pacing:** [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) serializes outbound Discogs HTTP through [`discogs-request-throttle.ts`](../../src/lib/discogs-request-throttle.ts). After each Discogs response, [`discogs-rate-limit.ts`](../../src/lib/discogs-rate-limit.ts) reads **`X-Discogs-Ratelimit`**, **`X-Discogs-Ratelimit-Used`**, and **`X-Discogs-Ratelimit-Remaining`** and adjusts spacing before the next call on that serverless instance (faster when quota remains, slower when the window is nearly exhausted). When Discogs omits those headers, pacing falls back to **`DISCOGS_MIN_REQUEST_INTERVAL_MS`** (default **1000** ms; set **0** to disable the fallback floor).

**Collection pagination retries:** [`useDiscogsCollectionQuery`](../../src/hooks/queries/useDiscogsCollectionQuery.ts) retries transient **503** / **429** page fetches (up to 3 attempts) using **`Retry-After`** when present without pausing the infinite query for auth revalidation. **`GET /api/collection`** forwards upstream Discogs **`Retry-After`** on **429** (via [`discogs-api-error.ts`](../../src/lib/discogs-api-error.ts)); when Discogs omits the header, the route falls back to **`DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS`** (60).

**Connect with Discogs** reuses stored OAuth tokens when available (typical after logout on the same browser). When tokens remain, the landing page shows **Connect with {username}** and **Use a different Discogs account** (`force=1`) below both connect buttons.

Auth route handlers must not be CDN-cached; see [platform.md](platform.md) (**Private session API responses**) for **`privateRouteJson`**, **`privateRouteRedirect`**, and [`src/proxy.ts`](../../src/proxy.ts).

If collection fetches fail after login, verify OAuth tokens (re-login), consumer app settings, and Discogs API status before assuming an app bug.

## Client-side collection access

Browsers call **`api.discogsCollection`** in [`src/api/urls.ts`](../../src/api/urls.ts), which hits **`/api/collection`** with the authenticated user's username—not the Discogs API directly. Collection (and related fields/value/release/search) fetches use **`credentials: "include"`**. Collection route handlers are **`force-dynamic`** with **`Vary: Cookie`** on success responses; see [platform.md](platform.md). On **401**, the collection React Query hook revalidates **`/api/auth/check`** before surfacing an error (see [patterns.md](patterns.md)).

**Adaptive pagination:** the first request uses **`COLLECTION_FIRST_PAGE_SIZE` (50)** for a faster first paint on small or unknown collections. If more pages remain, pagination **restarts** at Discogs page 1 with **`COLLECTION_PAGE_SIZE` (100)**—Discogs is page-based, so changing `per_page` mid-stream would skip or duplicate items. When **`pagination.items`** is at least **`COLLECTION_BOOTSTRAP_SKIP_MIN_ITEMS` (101)**, the client skips the bootstrap pass: it stores the total in **`localStorage`** ([`collectionItemCountStorage.ts`](../../src/utils/collectionItemCountStorage.ts)) and on later visits starts at **`per_page=100`**. [`getEffectiveCollectionPages`](../../src/utils/collectionPagination.ts) drops only a trailing bootstrap page (50 items), never a full-size page. [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) uses that helper before flattening releases. Constants live in [`src/constants/collection.ts`](../../src/constants/collection.ts). The collection API route caps `per_page` at **100** (Discogs documented max).

**IndexedDB collection cache:** after the collection is fully loaded, [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) persists React Query pages to IndexedDB via [`collectionCacheStorage.ts`](../../src/utils/collectionCacheStorage.ts) / [`collectionCacheSync.ts`](../../src/utils/collectionCacheSync.ts), including after a validated cache hit when fresh pages arrive. Personal rating and notes writes also patch the persisted cache immediately via [`patchPersistedCollectionReleaseRating`](../../src/utils/collectionCacheSync.ts) / [`patchPersistedCollectionReleaseNotes`](../../src/utils/collectionCacheSync.ts). On login, [`useCollectionCacheReady`](../../src/hooks/useCollectionCacheReady.hook.ts) validates the cache with a single page-1 request comparing **`pagination.items`** **before** hydrating the infinite query from disk. When validation passes, cached pages load instantly; when it fails (collection size changed on Discogs), IndexedDB is cleared and a full re-fetch runs on the same visit—stale pages are never injected into React Query. IndexedDB entries are kept indefinitely until that count check fails or the user runs **Clear All Data**. When validation passes after a cache hit, [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) runs an automatic **Sync collection** pass (same crate cleanup as Settings → Data) without a confirmation dialog; removals toast, zero removals stay silent. [`useDiscogsCollectionQuery`](../../src/hooks/queries/useDiscogsCollectionQuery.ts) uses **`COLLECTION_CACHE_STALE_MS` (24 hours)** for in-memory **`staleTime`** / **`gcTime`**. **Clear All Data** wipes the IndexedDB store via [`clearClientStoredData`](../../src/utils/clearClientStoredData.ts).

## Release detail and in-app playback

Full release metadata (tracklist, community videos) is **not** included in collection pagination. The app fetches it on demand when a release detail modal opens.

| Operation | App route | Discogs API |
|-----------|-----------|-------------|
| Read release detail | `GET /api/release/{releaseId}` | `GET /releases/{release_id}` |

Authenticated sessions use the user's OAuth tokens. Visitors without Discogs cookies get the same release payload via application (consumer) credentials so public crate pages can open the release modal and mini player.

Client helper: **`api.discogsRelease`** in [`src/api/urls.ts`](../../src/api/urls.ts). React Query: **`useDiscogsReleaseQuery`** ([`src/hooks/queries/useDiscogsReleaseQuery.ts`](../../src/hooks/queries/useDiscogsReleaseQuery.ts)) with **`DiscogsReleaseQueryKeys`**.

**Testing:** Assert the route contract in [`route.spec.ts`](../../src/app/api/release/[id]/route.spec.ts) and the client helper in [`helpers.spec.ts`](../../src/api/helpers.spec.ts). Rating writes: [`collection/releases/[releaseId]/rating/route.spec.ts`](../../src/app/api/collection/releases/[releaseId]/rating/route.spec.ts) and [`collection.rating.spec.ts`](../../src/api/endpoints/collection.rating.spec.ts). UI tests mock **`api.discogsRelease`** via **`src/api/urls`** and let **`useDiscogsReleaseQuery`** run on **`TestProviders`** (see [conventions.md → Testing](conventions.md#testing)).

Typed response fields live in [`src/types/discogs-release-detail.types.ts`](../../src/types/discogs-release-detail.types.ts): **`tracklist`** (position, title, duration, nested **`sub_tracks`**, per-track **`artists`** and **`extraartists`**), **`videos`** (YouTube **`uri`**, **`title`**, **`embed`**), **`community.rating`** (Discogs average **`average`** and **`count`**).

**Ratings:** Collection pagination includes your personal **`rating`** (0–5) per instance. Release detail adds **`community.rating`** for the Discogs-wide average. The release modal reads personal rating from the collection React Query cache via **`useCollectionReleaseByInstanceId`** (see [components.md](components.md) → ReleaseModal). **`ReleaseSummaryHero`** splits catalog metadata (label · year · catno) from ratings: **`ReleaseHeroRatingsRow`** shows your interactive stars and the community average on one line (`★ 4.80 (20)` — two decimals via **`formatCommunityRatingAverage`** in [`releaseDisplay.ts`](../../src/utils/releaseDisplay.ts), matching Discogs), separated by `·` when both are present. Authenticated users edit stars via **`ReleaseRatingPicker`** (native radio inputs in a **`<fieldset>`**); hover preview highlights stars below the cursor and dims stars above. Click the active star again to clear. Writes go to Discogs via **`PUT /api/collection/releases/{releaseId}/rating`** (clear with **`DELETE`**). Optimistic updates touch every collection item with the same release ID, patch the React Query collection cache and IndexedDB via [`patchCollectionQueryReleaseRating`](../../src/utils/collectionCacheSync.ts) / [`patchPersistedCollectionReleaseRating`](../../src/utils/collectionCacheSync.ts) — **no collection refetch** (Discogs pagination can lag behind the rating write). [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) keeps **`allReleasesAtom`** in sync for filters and cards. Client helpers: **`api.updateReleaseRating`**, **`api.clearReleaseRating`** in [`src/api/urls.ts`](../../src/api/urls.ts); hook: **`useReleaseRatingEditor`** ([`useReleaseRatingEditor.hook.ts`](../../src/components/ReleasePersonalRating/useReleaseRatingEditor.hook.ts)). **`COLLECTION_RATING_MIN`** / **`COLLECTION_RATING_MAX`** (1–5) live in [`src/constants/collection.ts`](../../src/constants/collection.ts). Sort options include **Your Rating** (collection field only)—community averages are not sortable because they require a separate Discogs request per release.

**Playback (v1):** Discogs does not stream audio. When a release has embeddable YouTube links in **`videos`**, [`ReleaseMiniPlayer`](../../src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component.tsx) (via global [`ReleasePlaybackProvider`](../../src/context/releasePlayback.context.tsx) + [`GlobalPlaybackDock`](../../src/components/GlobalPlaybackDock/GlobalPlaybackDock.component.tsx)) keeps playback alive across page navigations and when the modal closes. The modal and mini player share queue state — matched track rows call **`startPlayback`** (replacing the queue with the playable album from that track unless the listener has already curated the queue via **`addToQueue`** / **Add all to queue**, in which case **`startPlayback`** plays the clicked track and keeps the existing queue), **Add to queue** (list-plus icon) calls **`addToQueue`**, the tracklist toolbar **Add all to queue** (**`fmdReleaseTracklistAddAllButton`**) appends every playable album track not already queued; when no playback session is active (**`isMiniPlayerVisible`** is false), it also **`startPlayback`** on the first playable track **`startPaused: true`** with **`rebuildAlbumQueue: false`** so the mini player opens on that track paused, then queues the remaining playable rows., and prev/next walk the full cross-release queue. Unmatched embeddable videos render as track-style rows in **`ReleasePlaybackPreview`** (title-only left column — no track position — plus duration, add to queue, row click to play via **`startReleasePreview`** / **`addPreviewToQueue`**; dock shows the video title, not a track name). Track ↔ video pairing lives in **`buildReleasePlaybackMatchIndex`** / **`findVideoForTrack`** ([`src/utils/releasePlayback.ts`](../../src/utils/releasePlayback.ts)): title overlap (including side suffixes and alphanumeric reordering), **duration-weighted** greedy one-to-one assignment when multiple tracks and videos share the same name (e.g. MFSB **Zack's Fanfare** at 0:23 vs **Zack's Fanfare (I Hear Music)** at 0:51 for two identically titled track rows), with exact song-title matches preferred over parenthetical extensions, then a fallback for equal counts of **generic** titles (**`Untitled`**, **`Untitled01`**, **`Track N`**, …) vs leftover videos paired by tracklist order and **`Track N`** video titles when durations agree within **30s**. Modal and provider both use the same memoized index so playability and dock **`activeVideo`** stay aligned. See [components.md](components.md) → ReleaseModal / GlobalPlaybackDock for UI detail. Otherwise the UI links out to YouTube search. Coverage depends on community-submitted videos—many releases have none.

**Card click:** On **`/releases`**, clicking **cover art** or the overlay **Release details** button on desktop/mobile cards opens the release detail modal via **`onReleaseClick`**. On **`/crate/[id]`** (public crates), clicking **cover art** opens **`PublicReleaseModal`** (tracklist + playback via **`useRegisterPlaybackReleaseClick`**) — no collection notes, no crate toolbar, and format/style pills are static (not filter actions). **Title**, artist, and label text on cards link to Discogs in a new tab. The public modal toolbar includes **View on Discogs** and **Close** only.

## Collection notes (custom fields)

Discogs collection instances can include user-defined note fields (Media, Notes, etc.). Values are already present on each release in the **`/api/collection`** pagination payload as **`notes: [{ field_id, value }]`**. Normalize missing notes to **`[]`** when ingesting collection pages ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts)).

| Operation | App route | Discogs API |
|-----------|-----------|-------------|
| List field definitions | `GET /api/collection/fields?username=` | `GET /users/{username}/collection/fields` |
| Read note values | Included in collection pages | `GET /users/{username}/collection/folders/0/releases` |
| Update a note value | `POST /api/collection/instances/{instanceId}/fields/{fieldId}` | `POST /users/{username}/collection/folders/{folder_id}/releases/{release_id}/instances/{instance_id}/fields/{field_id}` with body `{ "value": "..." }` |
| Update your rating | `PUT /api/collection/releases/{releaseId}/rating` | `PUT /releases/{release_id}/rating/{username}` with body `{ "rating": 1..5 }` |
| Clear your rating | `DELETE /api/collection/releases/{releaseId}/rating?username=` | `DELETE /releases/{release_id}/rating/{username}` |

Client helpers: **`api.collectionFields`**, **`api.updateCollectionNote`**, **`api.updateReleaseRating`**, **`api.clearReleaseRating`** in [`src/api/urls.ts`](../../src/api/urls.ts). **`api.updateCollectionNote`** must tolerate empty success bodies from the app route (same as the Discogs **`204`** case).

React Query: **`useCollectionFieldsQuery`** ([`src/hooks/queries/useCollectionFieldsQuery.ts`](../../src/hooks/queries/useCollectionFieldsQuery.ts)) with **`CollectionFieldsQueryKeys`**.

Display/edit UI lives in [`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/). Note labels, search text, and write helpers are in [`src/utils/releaseNotes.ts`](../../src/utils/releaseNotes.ts).

**Write requests** require `releaseId`, `folderId`, `instanceId`, and `fieldId`:

- **`releaseId`**: **`parseReleaseId`** prefers **`basic_information.id`**, then top-level **`id`**, then **`basic_information.resource_url`**.
- **`folderId`**: **`getReleaseFolderId`** reads **`release.folder_id`**; defaults to **`0`** (All) when missing.
- **`instanceId`**: collection item **`instance_id`**.

**Length limit:** Discogs does not document a single global max for free-text note values; the app enforces **`COLLECTION_NOTE_MAX_LENGTH` (10,000)** via [`releaseNotes.schemas.ts`](../../src/lib/validation/releaseNotes.schemas.ts) in [`NoteEditDialog`](../../src/components/ReleaseNotes/NoteEditDialog.component.tsx) (inline counter + React Hook Form / Zod validation) and [`collection.schemas.ts`](../../src/lib/validation/collection.schemas.ts) on **`POST /api/collection/instances/[instanceId]/fields/[fieldId]`**. Constant lives in [`src/constants/collection.ts`](../../src/constants/collection.ts).

**Ratings:** **`PUT /api/collection/releases/[releaseId]/rating`** validates **`username`** + **`rating`** (1–5) via [`collection.schemas.ts`](../../src/lib/validation/collection.schemas.ts); shared **`discogsUsernameSchema`** lives in [`discogs.shared.schemas.ts`](../../src/lib/validation/discogs.shared.schemas.ts).

**Editing scope:** text and textarea fields (**`isEditableCollectionField`**) plus Media/Sleeve Condition dropdowns (**`isConditionCollectionField`**, **`getEditableConditionFields`**) via shared **`ReleaseNotesFormFields`**. All note field labels compose **[`field-label.module.css`](../../src/styles/modules/field-label.module.css)** (same uppercase muted style as filter controls and condition **`Select`** labels). Card/table editing uses **`NoteEditDialog`**; **`ReleaseModal`** uses **`ReleaseNotesModalEditor`** inline. **`releaseHasStoredConditionNotes`** keeps the modal notes section visible when only condition values are set. Condition values stay hidden from release-card/table display (**`forCard: true`** / **`isCardDisplayNoteField`**).

**Card UI:** **`ReleaseCard`** shows a sticky-note overlay action only (primary dot badge when notes exist)—no inline note preview on the card body. **`MobileReleaseCard`** has no notes action on the row; use **`ReleaseModal`** to edit. **`ReleaseNotesEditorProvider`** on each authenticated card still mounts **`NoteEditDialog`** for the desktop overlay icon.

**User-facing policy:** saving notes writes to the user's Discogs collection via the API; note text is not stored in Postgres. See **`/legal`** for Terms & Privacy copy.

**List UI:** **`ReleaseNotes`** with default **`inline`** variant shows note text plus **Add/Edit release notes** (no card provider).

After a successful write, **`useReleaseNotesEditor`** and **`useReleaseRatingEditor`** optimistically patch the React Query collection cache and IndexedDB via [`collectionCacheSync.ts`](../../src/utils/collectionCacheSync.ts) (page helpers in [`collectionReleaseLookup.ts`](../../src/utils/collectionReleaseLookup.ts)). **Notes** invalidate **`DiscogsCollectionQueryKeys`** after success. **Rating** does **not** invalidate the collection query — the optimistic patch is the source of truth until the next normal pagination refresh. On failure, each editor rolls back the optimistic cache patch and surfaces the upstream error message when available. [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) mirrors collection query updates into **`allReleasesAtom`** for filters and cards — editors do not dispatch to the atom directly.
