## OAuth flow

Implemented in [`src/services/discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) using **`oauth-1.0a`** and Node **`crypto`** for HMAC-SHA1 signing. The service overrides the library’s default **`oauth_nonce`** (which used **`Math.random()`**) with **`crypto.randomInt`** over the alphanumeric charset per character (uniform, no modulo bias) so consumer-signed requests stay compatible with Next.js prerender (e.g. **`generateMetadata`** on public pages).

| Step | Route / method                | Purpose                                                                                                                                   |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `GET /api/auth/discogs`       | Obtain request token, redirect to Discogs authorize                                                                                       |
| 2    | Discogs redirects to callback | User approves app                                                                                                                         |
| 3    | `GET /api/auth/callback`      | Exchange for access token, fetch identity, set cookies, upsert **`User`** via [`recordDiscogsLogin`](../../src/lib/user.server.ts); **`await`** [`runLoginSideEffectsAfterLoginWithLoggedFailure`](../../src/lib/runLoginSideEffectsAfterLogin.server.ts) before redirect (Discogs profile **`email`** backfill, then welcome mail) |
| 4    | `GET /api/auth/check`         | Verify tokens still valid; return **`avatarUrl`** when profile fetch succeeds                                                             |
| 5    | `POST /api/auth/logout`       | Clear session cookies; clear cached **`avatarUrl`** for the user                                                                          |
| 6    | `POST /api/auth/clear-data`   | Delete **`User`** row (cascades crates, playlists, playback stats), and clear session (Settings / About / Legal) |

Temporary OAuth request tokens use short-lived cookies (`oauth_token`, `oauth_token_secret`) cleared after callback.

