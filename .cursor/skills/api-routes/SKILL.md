---
name: api-routes
description: >-
  Next.js App Router API handlers — OAuth auth, Zod bodies, privateRouteJson,
  route.spec.ts. Use when editing src/app/api.
---

# API routes

Deep dive: [database.md → API routes](../../docs/handbook/database.md), [discogs.md → Authenticated API routes](../../docs/handbook/discogs.md), [platform.md → Private session API](../../docs/handbook/platform.md).

## Checklist

1. **Auth** — `requireAuthenticatedDiscogsUser` / `getVerifiedUserFromRequestWithRateLimit` ([`auth-request.ts`](../../src/lib/auth-request.ts), [`api-helpers.ts`](../../src/lib/api-helpers.ts)). Never authorize with `discogs_user_id` / `discogs_username` cookies alone.
2. **Usernames** — `isValidDiscogsUsername` ([`discogs-username.ts`](../../src/lib/discogs-username.ts)); collection routes: verified username must match param (case-insensitive).
3. **Body** — Zod in [`src/lib/validation/`](../../src/lib/validation/) + [`parseRequestBody`](../../src/lib/validation/parseRequestBody.ts); extend schemas, no ad-hoc parsing.
4. **JSON** — Private session responses: **`privateRouteJson`** / **`createErrorResponse`** — not bare `NextResponse.json` on authenticated routes.
5. **Cache Components** — Do **not** add `export const dynamic = "force-dynamic"` only for cookies.
6. **Tests** — Co-locate **`route.spec.ts`**; mock Prisma/services; assert status, JSON, auth failures.

## References

- Collection proxy: [`src/app/api/collection/route.ts`](../../src/app/api/collection/route.ts)
- Crate mutations: [database.md route table](../../docs/handbook/database.md#api-routes)
