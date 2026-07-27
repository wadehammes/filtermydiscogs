# Discogs integration

OAuth 1.0a authentication, API access, username validation, and cookie conventions.

## OAuth flow

Implemented in [`src/services/discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) using **`oauth-1.0a`** and Node **`crypto`** for HMAC-SHA1 signing.

| Step | Route / method | Purpose |
|------|----------------|---------|
| 1 | `GET /api/auth/discogs` | Obtain request token, redirect to Discogs authorize |
| 2 | Discogs redirects to callback | User approves app |
| 3 | `GET /api/auth/callback` | Exchange for access token, fetch identity, set cookies |
| 4 | `GET /api/auth/check` | Verify tokens still valid |
| 5 | `POST /api/auth/logout` | Clear session cookies |
| 6 | `POST /api/auth/clear-data` | Delete user's crates and clear session (About/Legal data management) |

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
| `discogs_access_token` | yes | OAuth access token |
| `discogs_access_token_secret` | yes | OAuth access token secret |
| `discogs_username` | no | Display name; readable by client JS |
| `discogs_user_id` | yes | Numeric Discogs user ID; display/cache only—**never** used for API authorization |

`secure` is **`false` in development**, **`true` in production**. Max age: 30 days.

Client reads username via [`getUsernameFromCookies`](../../src/services/auth.service.ts) (`js-cookie`). User ID comes from [`/api/auth/check`](../../src/app/api/auth/check/route.ts) (verified OAuth identity) and is stored in [`AuthProvider`](../../src/context/auth.context.tsx)—not from a client-readable cookie. Access tokens are **never** exposed to client JS.

## Authenticated API routes

Route handlers that proxy Discogs (e.g. **`/api/collection`**, **`/api/collection/fields`**, **`/api/collection/instances/{instanceId}/fields/{fieldId}`**, **`/api/collection/value`**, **`/api/search`**) must:

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
- **`getIdentity`**, **`getCollection`**, **`getCollectionFields`**, **`updateCollectionInstanceField`**, **`getCollectionValue`**, **`search`**, release fetches
- Error handling for HTTP failures (including mapping upstream 5xx to clearer client responses where implemented)
- **Empty success bodies**: Discogs often returns **`204 No Content`** (or an empty body) for successful field writes. **`makeAuthenticatedRequest`** treats **`204`/`205`** and empty bodies as success—do not call **`response.json()`** on those responses.

All Discogs HTTP calls include a **`User-Agent`** identifying the app (required by Discogs API terms).

## Rate limits and errors

Discogs may return **429** (rate limit) or **5xx** (upstream errors). Route handlers should return appropriate status codes and messages; clients surface errors via React Query / context error state.

**OAuth identity lookups** (`getVerifiedUserFromRequest` in [`src/lib/auth-request.ts`](../../src/lib/auth-request.ts)) are cached in memory for a short TTL ([`src/lib/identity-cache.ts`](../../src/lib/identity-cache.ts)) so `/api/auth/check` and crate routes do not call `oauth/identity` on every request. Concurrent lookups for the same token pair share one in-flight request. On Discogs **429**, data routes reuse only a recently cached identity keyed to the current OAuth token pair; they **never** fall back to `discogs_user_id` / `discogs_username` cookies. **`/api/auth/check`** alone may return a display-only identity from those cookies with **`rateLimited: true`**; the client blocks collection and crate fetches until verification succeeds.

**Explicit login** always uses **`GET /api/auth/discogs?force=1`**, which clears any existing session and requires a fresh Discogs authorization (prevents silently reusing another user's tokens on a shared browser).

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

Client helper: **`fetchDiscogsRelease`** in [`src/api/helpers.ts`](../../src/api/helpers.ts). React Query: **`useDiscogsReleaseQuery`** ([`src/hooks/queries/useDiscogsReleaseQuery.ts`](../../src/hooks/queries/useDiscogsReleaseQuery.ts)) with **`DiscogsReleaseQueryKeys`**.

**Testing:** Assert the route contract in [`route.test.ts`](../../src/app/api/release/[id]/route.test.ts) and the client helper in [`helpers.test.ts`](../../src/api/helpers.test.ts). UI tests mock **`fetchDiscogsRelease`** via **`src/api/helpers`** and let **`useDiscogsReleaseQuery`** run on **`TestProviders`** (see [conventions.md → Testing](conventions.md#testing)).

Typed response fields live in [`src/types/discogs-release-detail.types.ts`](../../src/types/discogs-release-detail.types.ts): **`tracklist`** (position, title, duration, nested **`sub_tracks`**, per-track **`artists`** and **`extraartists`**), **`videos`** (YouTube **`uri`**, **`title`**, **`embed`**), **`community.rating`** (Discogs average **`average`** and **`count`**).

**Ratings:** Collection pagination includes your personal **`rating`** (0–5) per instance. Release detail adds **`community.rating`** for the Discogs-wide average. **`ReleaseSummaryHero`** appends your rating and the community average to the label/year meta line when available (community average uses a star icon instead of the word “Community”). Format and style filter pills remain below that meta line. Sort options include **Your Rating** (collection field only)—community averages are not sortable because they require a separate Discogs request per release.

**Playback (v1):** Discogs does not stream audio. When a release has embeddable YouTube links in **`videos`**, [`ReleaseMiniPlayer`](../../src/components/ReleasePlayback/ReleaseMiniPlayer.component.tsx) (via [`ReleasePlaybackProvider`](../../src/context/releasePlayback.context.tsx)) keeps playback alive when the modal closes. The modal and mini player share album queue state — track rows in the modal call **`startPlayback`**, but the YouTube embed stays in the dock. Track rows call **`findVideoForTrack`** in [`src/utils/releasePlayback.ts`](../../src/utils/releasePlayback.ts) to pick the best match; otherwise the UI links out to YouTube search. Coverage depends on community-submitted videos—many releases have none.

**Card click:** On **`/releases`**, clicking **cover art** or the overlay **Release details** button on desktop/mobile cards opens the release detail modal via **`onReleaseClick`**. **Title**, artist, and label text link to Discogs in a new tab, as does the overlay **View on Discogs** button. The modal toolbar also includes **View on Discogs**. Collection card overlays expose details, Discogs, notes, and crate actions; public crate cards have no overlay actions.

## Collection notes (custom fields)

Discogs collection instances can include user-defined note fields (Media, Notes, etc.). Values are already present on each release in the **`/api/collection`** pagination payload as **`notes: [{ field_id, value }]`**. Normalize missing notes to **`[]`** when ingesting collection pages ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts)).

| Operation | App route | Discogs API |
|-----------|-----------|-------------|
| List field definitions | `GET /api/collection/fields?username=` | `GET /users/{username}/collection/fields` |
| Read note values | Included in collection pages | `GET /users/{username}/collection/folders/0/releases` |
| Update a note value | `POST /api/collection/instances/{instanceId}/fields/{fieldId}` | `POST /users/{username}/collection/folders/{folder_id}/releases/{release_id}/instances/{instance_id}/fields/{field_id}` with body `{ "value": "..." }` |

Client helpers: **`fetchCollectionFields`**, **`updateCollectionNote`** in [`src/api/helpers.ts`](../../src/api/helpers.ts). **`updateCollectionNote`** must tolerate empty success bodies from the app route (same as the Discogs **`204`** case).

React Query: **`useCollectionFieldsQuery`** ([`src/hooks/queries/useCollectionFieldsQuery.ts`](../../src/hooks/queries/useCollectionFieldsQuery.ts)) with **`CollectionFieldsQueryKeys`**.

Display/edit UI lives in [`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/). Note labels, search text, and write helpers are in [`src/utils/releaseNotes.ts`](../../src/utils/releaseNotes.ts).

**Write requests** require `releaseId`, `folderId`, `instanceId`, and `fieldId`:

- **`releaseId`**: **`parseReleaseId`** prefers **`basic_information.id`**, then top-level **`id`**, then **`basic_information.resource_url`**.
- **`folderId`**: **`getReleaseFolderId`** reads **`release.folder_id`**; defaults to **`0`** (All) when missing.
- **`instanceId`**: collection item **`instance_id`**.

**Editing scope (v1):** text and textarea field types only (**`isEditableCollectionField`**). Dropdown/boolean fields (e.g. Media/Sleeve Condition) are hidden from release-card and table display via **`forCard: true`** / **`isCardDisplayNoteField`**; the default **`inline`** list variant may still show all fields.

**Card UI:** every release card shows a **Notes** heading and a fixed-height scroll region (**`max-height: 4lh`**). Cards without notes show an **Add notes** link when editing is available. The sticky-note icon and inline link share one dialog via **`ReleaseNotesEditorProvider`** on **`ReleaseCard`** / **`MobileReleaseCard`**.

**User-facing policy:** saving notes writes to the user's Discogs collection via the API; note text is not stored in Postgres. See **`/legal`** for Terms & Privacy copy.

**List UI:** **`ReleaseNotes`** with default **`inline`** variant shows note text plus **Add/Edit release notes** (no card provider).

After a successful write, **`useReleaseNotesEditor`** optimistically updates **`allReleasesAtom`** and invalidates **`DiscogsCollectionQueryKeys`** for the active username. On failure, it rolls back the optimistic update and surfaces the upstream error message when available.
