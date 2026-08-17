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
- **`getIdentity`**, **`getCollection`**, **`getCollectionFields`**, **`updateCollectionInstanceField`**, **`updateReleaseRating`**, **`deleteReleaseRating`**, **`getCollectionValue`**, **`search`**, release fetches
- Error handling for HTTP failures (including mapping upstream 5xx to clearer client responses where implemented)
- **Empty success bodies**: Discogs often returns **`204 No Content`** (or an empty body) for successful field writes. **`makeAuthenticatedRequest`** treats **`204`/`205`** and empty bodies as success—do not call **`response.json()`** on those responses.

All Discogs HTTP calls include a **`User-Agent`** identifying the app (required by Discogs API terms).

## Rate limits and errors

Discogs may return **429** (rate limit) or **5xx** (upstream errors). Route handlers should return appropriate status codes and messages; clients surface errors via React Query / context error state.

**OAuth identity lookups** (`getVerifiedUserFromRequest` in [`src/lib/auth-request.ts`](../../src/lib/auth-request.ts)) are cached in memory for a short TTL ([`src/lib/identity-cache.ts`](../../src/lib/identity-cache.ts)) so `/api/auth/check` and crate routes do not call `oauth/identity` on every request. Concurrent lookups for the same token pair share one in-flight request. On Discogs **429**, data routes reuse only a recently cached identity keyed to the current OAuth token pair; they **never** fall back to `discogs_user_id` / `discogs_username` cookies. **`/api/auth/check`** alone may return a display-only identity from those cookies with **`rateLimited: true`**; the client blocks collection and crate fetches until verification succeeds.

**Connect with Discogs** reuses stored OAuth tokens when available (typical after logout on the same browser). When tokens remain, the landing page shows **Connect with {username}** and **Use a different Discogs account** (`force=1`) below both connect buttons.

Auth route handlers must not be CDN-cached; see [platform.md](platform.md) (**Private session API responses**) for **`privateRouteJson`**, **`privateRouteRedirect`**, and [`src/proxy.ts`](../../src/proxy.ts).

If collection fetches fail after login, verify OAuth tokens (re-login), consumer app settings, and Discogs API status before assuming an app bug.

## Client-side collection access

Browsers call **`fetchDiscogsCollection`** in [`src/api/helpers.ts`](../../src/api/helpers.ts), which hits **`/api/collection`** with the authenticated user's username—not the Discogs API directly. Collection (and related fields/value/release/search) fetches use **`credentials: "include"`**. Collection route handlers are **`force-dynamic`** with **`Vary: Cookie`** on success responses; see [platform.md](platform.md). On **401**, the collection React Query hook revalidates **`/api/auth/check`** before surfacing an error (see [patterns.md](patterns.md)).

**Adaptive pagination:** the first request uses **`COLLECTION_FIRST_PAGE_SIZE` (50)** for a faster first paint. If more pages remain, pagination **restarts** at Discogs page 1 with **`COLLECTION_PAGE_SIZE` (100)**—Discogs is page-based, so changing `per_page` mid-stream would skip or duplicate items. [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts) drops the bootstrap page once full-size pages arrive ([`collectionPagination.ts`](../../src/utils/collectionPagination.ts)). Constants live in [`src/constants/collection.ts`](../../src/constants/collection.ts). The collection API route caps `per_page` at **100** (Discogs documented max).

## Release detail and in-app playback

Full release metadata (tracklist, community videos) is **not** included in collection pagination. The app fetches it on demand when a release detail modal opens.

| Operation | App route | Discogs API |
|-----------|-----------|-------------|
| Read release detail | `GET /api/release/{releaseId}` | `GET /releases/{release_id}` |

Authenticated sessions use the user's OAuth tokens. Visitors without Discogs cookies get the same release payload via application (consumer) credentials so public crate pages can open the release modal and mini player.

Client helper: **`fetchDiscogsRelease`** in [`src/api/helpers.ts`](../../src/api/helpers.ts). React Query: **`useDiscogsReleaseQuery`** ([`src/hooks/queries/useDiscogsReleaseQuery.ts`](../../src/hooks/queries/useDiscogsReleaseQuery.ts)) with **`DiscogsReleaseQueryKeys`**.

**Testing:** Assert the route contract in [`route.spec.ts`](../../src/app/api/release/[id]/route.spec.ts) and the client helper in [`helpers.spec.ts`](../../src/api/helpers.spec.ts). Rating writes: [`collection/releases/[releaseId]/rating/route.spec.ts`](../../src/app/api/collection/releases/[releaseId]/rating/route.spec.ts) and [`helpers.rating.spec.ts`](../../src/api/helpers.rating.spec.ts). UI tests mock **`fetchDiscogsRelease`** via **`src/api/helpers`** and let **`useDiscogsReleaseQuery`** run on **`TestProviders`** (see [conventions.md → Testing](conventions.md#testing)).

Typed response fields live in [`src/types/discogs-release-detail.types.ts`](../../src/types/discogs-release-detail.types.ts): **`tracklist`** (position, title, duration, nested **`sub_tracks`**, per-track **`artists`** and **`extraartists`**), **`videos`** (YouTube **`uri`**, **`title`**, **`embed`**), **`community.rating`** (Discogs average **`average`** and **`count`**).

**Ratings:** Collection pagination includes your personal **`rating`** (0–5) per instance. Release detail adds **`community.rating`** for the Discogs-wide average. **`ReleaseSummaryHero`** splits catalog metadata (label · year · catno) from ratings: **`ReleaseHeroRatingsRow`** shows your interactive stars and the community average on one line (`★ 4.8 (20)`), separated by `·` when both are present. Authenticated users edit stars via **`ReleaseRatingPicker`** (native radio inputs in a **`<fieldset>`**); hover preview highlights stars below the cursor and dims stars above. Click the active star again to clear. Writes go to Discogs via **`PUT /api/collection/releases/{releaseId}/rating`** (clear with **`DELETE`**). Optimistic updates touch every collection item with the same release ID, then invalidate **`DiscogsCollectionQueryKeys`** and **`DiscogsReleaseQueryKeys.byId`** so the open modal refetches community rating from **`useDiscogsReleaseQuery`**. Client helpers: **`updateReleaseRating`**, **`clearReleaseRating`** in [`src/api/helpers.ts`](../../src/api/helpers.ts); hook: **`useReleaseRatingEditor`** ([`useReleaseRatingEditor.hook.ts`](../../src/components/ReleaseModal/useReleaseRatingEditor.hook.ts)). **`COLLECTION_RATING_MIN`** / **`COLLECTION_RATING_MAX`** (1–5) live in [`src/constants/collection.ts`](../../src/constants/collection.ts). Sort options include **Your Rating** (collection field only)—community averages are not sortable because they require a separate Discogs request per release.

**Playback (v1):** Discogs does not stream audio. When a release has embeddable YouTube links in **`videos`**, [`ReleaseMiniPlayer`](../../src/components/ReleasePlayback/ReleaseMiniPlayer.component.tsx) (via global [`ReleasePlaybackProvider`](../../src/context/releasePlayback.context.tsx) + [`GlobalPlaybackDock`](../../src/components/ReleasePlayback/GlobalPlaybackDock.component.tsx)) keeps playback alive across page navigations and when the modal closes. The modal and mini player share queue state — track rows call **`startPlayback`** (replacing the queue with the playable album from that track), **Add to queue** (hover list icon) calls **`addToQueue`**, and prev/next walk the full cross-release queue. Track rows call **`findVideoForTrack`** in [`src/utils/releasePlayback.ts`](../../src/utils/releasePlayback.ts) to pick the best match; otherwise the UI links out to YouTube search. Coverage depends on community-submitted videos—many releases have none.

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

Client helpers: **`fetchCollectionFields`**, **`updateCollectionNote`**, **`updateReleaseRating`**, **`clearReleaseRating`** in [`src/api/helpers.ts`](../../src/api/helpers.ts). **`updateCollectionNote`** must tolerate empty success bodies from the app route (same as the Discogs **`204`** case).

React Query: **`useCollectionFieldsQuery`** ([`src/hooks/queries/useCollectionFieldsQuery.ts`](../../src/hooks/queries/useCollectionFieldsQuery.ts)) with **`CollectionFieldsQueryKeys`**.

Display/edit UI lives in [`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/). Note labels, search text, and write helpers are in [`src/utils/releaseNotes.ts`](../../src/utils/releaseNotes.ts).

**Write requests** require `releaseId`, `folderId`, `instanceId`, and `fieldId`:

- **`releaseId`**: **`parseReleaseId`** prefers **`basic_information.id`**, then top-level **`id`**, then **`basic_information.resource_url`**.
- **`folderId`**: **`getReleaseFolderId`** reads **`release.folder_id`**; defaults to **`0`** (All) when missing.
- **`instanceId`**: collection item **`instance_id`**.

**Length limit:** Discogs does not document a single global max for free-text note values; the app enforces **`COLLECTION_NOTE_MAX_LENGTH` (10,000)** in [`NoteEditDialog`](../../src/components/ReleaseNotes/NoteEditDialog.component.tsx) (inline counter + React Hook Form validation) and the collection note write route. Constant lives in [`src/constants/collection.ts`](../../src/constants/collection.ts).

**Editing scope:** text and textarea fields (**`isEditableCollectionField`**) plus Media/Sleeve Condition dropdowns (**`isConditionCollectionField`**, **`getEditableConditionFields`**) via shared **`ReleaseNotesFormFields`**. All note field labels compose **[`field-label.module.css`](../../src/styles/field-label.module.css)** (same uppercase muted style as filter controls and condition **`Select`** labels). Card/table editing uses **`NoteEditDialog`**; **`ReleaseModal`** uses **`ReleaseNotesModalEditor`** inline. **`releaseHasStoredConditionNotes`** keeps the modal notes section visible when only condition values are set. Condition values stay hidden from release-card/table display (**`forCard: true`** / **`isCardDisplayNoteField`**).

**Card UI:** **`ReleaseCard`** and **`MobileReleaseCard`** show a sticky-note overlay action only (primary dot badge when notes exist)—no inline note preview on the card body. **`ReleaseNotesEditorProvider`** on each card mounts **`NoteEditDialog`** for that icon.

**User-facing policy:** saving notes writes to the user's Discogs collection via the API; note text is not stored in Postgres. See **`/legal`** for Terms & Privacy copy.

**List UI:** **`ReleaseNotes`** with default **`inline`** variant shows note text plus **Add/Edit release notes** (no card provider).

After a successful write, **`useReleaseNotesEditor`** optimistically updates **`allReleasesAtom`** and invalidates **`DiscogsCollectionQueryKeys`** for the active username. On failure, it rolls back the optimistic update and surfaces the upstream error message when available. **`useReleaseRatingEditor`** follows the same optimistic-update + invalidation pattern for personal ratings and also invalidates **`DiscogsReleaseQueryKeys.byId`** for the rated release.
