## Session cookies

Set in [`src/app/api/auth/callback/route.ts`](../../src/app/api/auth/callback/route.ts):

| Cookie                        | httpOnly | Purpose                                                                                |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `discogs_reconnect_username`  | no       | Last connected Discogs username for quick re-login after logout; display only          |
| `discogs_session`             | yes      | Active app session; cleared on logout while OAuth tokens may remain for quick re-login |
| `discogs_access_token`        | yes      | OAuth access token                                                                     |
| `discogs_access_token_secret` | yes      | OAuth access token secret                                                              |
| `discogs_username`            | no       | Display name; readable by client JS                                                    |
| `discogs_user_id`             | yes      | Numeric Discogs user ID; display/cache only—**never** used for API authorization       |

`secure` is **`false` in development**, **`true` in production**. Max age: 30 days.

Client reads username via [`getUsernameFromCookies`](../../src/services/auth.service.ts) (`js-cookie`). User ID and **`avatarUrl`** come from [`/api/auth/check`](../../src/app/api/auth/check/route.ts) (verified OAuth identity; avatar via **`GET /users/{username}`** through [`resolveDiscogsAvatarUrl`](../../src/lib/user-profile.server.ts) with a 24h in-memory cache and in-flight request dedup in [`user-profile-cache.ts`](../../src/lib/user-profile-cache.ts)—see [`user-profile-cache.spec.ts`](../../src/lib/user-profile-cache.spec.ts)) and are stored in [`AuthProvider`](../../src/context/auth.context.tsx)—not from a client-readable cookie. Header avatars render through [`buildDiscogsAvatarProxyUrl`](../../src/utils/discogsAvatarUrl.ts) → **`/api/image-proxy`**. Access tokens are **never** exposed to client JS.

