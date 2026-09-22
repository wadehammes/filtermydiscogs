---
name: oauth-and-session
description: >-
  Discogs OAuth 1.0a, session cookies, auth check, login flow. Use for auth
  routes, session bugs, or protected pages.
---

# OAuth and session

Handbook: [discogs.md](../../docs/handbook/discogs.md), [patterns.md → Authentication flow](../../docs/handbook/patterns.md#authentication-flow).

## Flow

| Step | Route |
|------|--------|
| Start OAuth | `GET /api/auth/discogs` |
| Callback | `GET /api/auth/callback` — sets cookies, upserts **`User`** |
| Session check | `GET /api/auth/check` |
| Logout | `POST /api/auth/logout` |
| Clear all data | `POST /api/auth/clear-data` |

Service: [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts).

## Cookies

- **httpOnly tokens** — never exposed to client JS.
- **`discogs_user_id`** — display/cache only; **not** for API authorization.
- Client username: [`getUsernameFromCookies`](../../src/services/auth.service.ts); identity/avatar from **`/api/auth/check`** → **`AuthProvider`**.

## Route handlers

1. Verify session (`requireAuthenticatedDiscogsUser` / `getVerifiedUserFromRequest`).
2. Validate username param with **`isValidDiscogsUsername`**.
3. Match verified identity to requested username for collection routes.
4. Call **`discogsOAuthService`** with token + secret.

## Env

`DISCOGS_CONSUMER_KEY`, `DISCOGS_CONSUMER_SECRET`, `DISCOGS_CALLBACK_URL` — see root README and [discogs.md → Environment variables](../../docs/handbook/discogs.md#environment-variables).
