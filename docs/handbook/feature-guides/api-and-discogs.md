# API layer and Discogs integration

## What users experience

- The browser never holds Discogs OAuth secrets—it calls **`/api/...`** on our origin.
- Rate limiting and “Discogs is down” behavior are consistent across collection, release detail, and batch hydrate.
- Client code uses one typed **`api`** object instead of scattered URL strings.

## Moving parts

| Layer | Location |
| ----- | -------- |
| Client facade | [`src/api/urls.ts`](../../../src/api/urls.ts) |
| Endpoint implementations | [`src/api/endpoints/*.ts`](../../../src/api/endpoints/) |
| Route handlers | [`src/app/api/**/route.ts`](../../../src/app/api/) |
| OAuth signing | [`discogs-oauth.service.ts`](../../../src/services/discogs-oauth.service.ts) |
| Sequential Discogs fetch | [`fetchDiscogsReleaseRecordsSequential.server.ts`](../../../src/lib/fetchDiscogsReleaseRecordsSequential.server.ts) |

## Decisions & rationale

### Single `api.*` front door

**Decision:** Components and hooks call `api.collection()`, `api.discogsReleaseBatch()`, etc.—not template literals for `/api`.

**Why:**

- Refactors to route paths stay in one place.
- Easier to mock in hook specs (`jest.mock('src/api/urls')`).
- Typed request/response shapes live next to endpoints.

### Zod on route bodies and queries

**Decision:** Handlers parse with schemas in [`src/lib/validation/`](../../../src/lib/validation/).

**Why:** Fail fast with stable error JSON; keeps handler branches small. See [database.md → Request validation](../database.md).

### Private JSON responses use shared helpers

**Decision:** Authenticated routes return via `privateRouteJson` / `createErrorResponse`.

**Why:** Consistent cache headers, error shape, and security review surface.

### Throttle queue for Discogs upstream

**Decision:** Release fetches go through a shared throttled executor with caller labels (e.g. `publicPlaylistHydrate`, batch route).

**Why:** Discogs enforces rate limits; parallel fan-out from every playlist view would 429 the app. Sequential fetch trades latency for stability—motivation for **client** batching and **snapshotsOnly** SSR.

**User-visible:** Busy queue may return **503** with `Retry-After` on some routes (see [discogs.md](../discogs.md)).

### `POST /api/release/batch` for client hydrate

**Decision:** Accept up to [`RELEASE_BATCH_MAX_IDS`](../../../src/constants/collection.ts) (25) ids; return a map of details; client writes React Query cache per id.

**Why:** One round trip per chunk instead of N release routes; cache shared by modal and playlist rows.

Guests may call batch (public cache headers) when IP rate limit allows—supports incognito playlist views.

## Code snapshot: batch route core

```ts
// app/api/release/batch/route.ts (pattern)
const parsedBody = await parseRequestBody(request, releaseBatchBodySchema);
// optional read-only session for authenticated cache variant
const releases = await fetchDiscogsReleaseRecordsSequential({
  releaseIds: parsedBody.ids,
  useAuthenticatedSession,
  throttleCaller: DISCOGS_THROTTLE_CALLERS.releaseBatch,
});
return NextResponse.json({ releases }, { headers: { "Cache-Control": cacheControl } });
```

## Code snapshot: client cache hydrate

```ts
// discogsReleaseBatchCache.ts (pattern)
export const fetchDiscogsReleaseDetailsIntoCache = async (
  queryClient: QueryClient,
  releaseIds: string[],
) => {
  for (const chunk of chunkDiscogsReleaseIds(releaseIds)) {
    const { releases } = await api.discogsReleaseBatch({ ids: chunk });
    for (const [id, detail] of Object.entries(releases)) {
      queryClient.setQueryData(
        discogsReleaseQueryOptions(id).queryKey,
        detail,
      );
    }
  }
};
```

## Code snapshot: hook consumes cache

```ts
export const useHydrateDiscogsReleaseDetails = ({ releaseIds, enabled }) => {
  const queryClient = useQueryClient();
  return useQuery({
    ...hydrateDiscogsReleaseDetailsQueryOptions(releaseIds, queryClient),
    enabled: enabled && releaseIds.length > 0,
    placeholderData: readDiscogsReleaseDetailsFromCache(queryClient, releaseIds),
  });
};
```

`placeholderData` avoids flashing empty state when snapshots already seeded per-release queries.

## Related reading

- [api-routes.md](../api-routes.md) auth tiers
- [discogs.md](../discogs.md) OAuth and errors
- [conventions.md → API route tests](../conventions.md#testing)