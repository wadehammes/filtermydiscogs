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
| 5 | `GET /api/auth/logout` | Clear session cookies |

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
| `discogs_user_id` | no | Numeric Discogs user ID; used for crate scoping and admin |

`secure` is **`false` in development**, **`true` in production**. Max age: 30 days.

Client reads username via [`getUsernameFromCookies`](../../src/services/auth.service.ts) (`js-cookie`). Access tokens are **never** exposed to client JS.

## Authenticated API routes

Route handlers that proxy Discogs (e.g. **`/api/collection`**, **`/api/collection/value`**, **`/api/search`**) must:

1. Read access token cookies.
2. Validate the **`username`** query param with **`isValidDiscogsUsername`** ([`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts)).
3. Confirm **`storedUsername`** matches the requested username (**case-insensitive** for collection routes).
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
- **`getIdentity`**, **`getCollection`**, **`getCollectionValue`**, **`search`**, release fetches
- Error handling for HTTP failures (including mapping upstream 5xx to clearer client responses where implemented)

All Discogs HTTP calls include a **`User-Agent`** identifying the app (required by Discogs API terms).

## Rate limits and errors

Discogs may return **429** (rate limit) or **5xx** (upstream errors). Route handlers should return appropriate status codes and messages; clients surface errors via React Query / context error state.

If collection fetches fail after login, verify OAuth tokens (re-login), consumer app settings, and Discogs API status before assuming an app bug.

## Client-side collection access

Browsers call **`fetchDiscogsCollection`** in [`src/api/helpers.ts`](../../src/api/helpers.ts), which hits **`/api/collection`** with the authenticated user's username—not the Discogs API directly.
