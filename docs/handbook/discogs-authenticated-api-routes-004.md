## Authenticated API routes

Route handlers that proxy Discogs (e.g. **`/api/collection`**, **`/api/collection/fields`**, **`/api/collection/instances/{instanceId}/fields/{fieldId}`**, **`/api/collection/releases/{releaseId}/rating`**, **`/api/collection/value`**, **`/api/search`**) must:
1. Verify the session with **`requireAuthenticatedDiscogsUser`** or **`getVerifiedUserFromRequest`** ([`src/lib/auth-request.ts`](../../src/lib/auth-request.ts))—never trust **`discogs_user_id`** or **`discogs_username`** cookies for authorization.
2. Validate the **`username`** query/body param with **`isValidDiscogsUsername`** ([`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts)).
3. Confirm the verified identity username matches the requested username (**case-insensitive** for collection routes).
4. Call **`discogsOAuthService`** methods with token + secret.

Collection route: [`src/app/api/collection/route.ts`](../../src/app/api/collection/route.ts).

