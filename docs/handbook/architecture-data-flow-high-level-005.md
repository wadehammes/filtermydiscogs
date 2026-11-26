## Data flow (high level)

### Authenticated collection browsing

1. User completes **Discogs OAuth**; access tokens and username land in **httpOnly / client-readable cookies** (see [discogs.md](discogs.md)).
2. **`AuthProvider`** checks `/api/auth/check` and reads `discogs_username` from cookies.
3. **`useDiscogsCollectionQuery`** (React Query) calls **`api.discogsCollection`** in [`src/api/urls.ts`](../../src/api/urls.ts).
4. **`GET /api/collection`** validates the username, confirms cookie auth matches (case-insensitive), and calls **`discogsOAuthService.getCollection`** with signed OAuth headers.
5. **`useCollectionData`** flattens pages and dispatches **`FiltersActionTypes.SetAllReleases`** after each page so the grid fills incrementally; **`collectionFiltersActiveAtom`** gates in-session filter inputs until the last page (saved prefs are offered via toast on **`/collection`**, not auto-applied). Pagination metadata goes to **`CollectionContext`**. **Filter atoms** derive filtered/sorted lists for the releases table, cards, mosaic, dashboard, and random release.

### Crates

1. Client mutations call **`/api/crates`** route handlers.
2. Handlers use **Prisma** to read/write `Crate` and `CrateRelease` rows scoped by **verified OAuth user ID** from **`getVerifiedUserFromRequestWithRateLimit`**—never the `discogs_user_id` cookie alone ([database.md](database.md)).
3. Public crates expose read-only data at **`/crate/[id]`** via [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) (page metadata via [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)).

