# Collection browsing: cache, pagination, and filters

## What users experience

- After the first sync, `/collection` can show releases quickly from local cache while pages still stream from Discogs in the background.
- Filters and sort apply instantly on the cached set.
- Large collections paginate without loading every release into memory on day one.

## Moving parts

| Step | What happens |
| ---- | ------------- |
| Login | [`CollectionCachePrepGate`](../../../src/components/CollectionCachePrepGate/CollectionCachePrepGate.component.tsx) hydrates IndexedDB → React Query when a username exists |
| Pagination | [`useCollectionData`](../../../src/hooks/useCollectionData.hook.ts) fetches pages via `api.collection` |
| Client list | [`allReleasesAtom`](../../../src/atoms/filters.atoms.ts) receives merged pages |
| UI | [`ReleasesClient`](../../../src/components/ReleasesClient/ReleasesClient.component.tsx) + Jotai-derived lists |

## Decisions & rationale

### IndexedDB + React Query, not “Query only”

**Decision:** Persist collection pages in IndexedDB and seed the query cache on startup.

**Why:**

- Re-login or soft reconnect should not flash an empty grid while Discogs is slow.
- React Query remains the in-memory source of truth for the current session; IndexedDB is a durable bootstrap layer.

**Tradeoff:** More moving parts (validation, schema version bumps in clear-data flows). Documented in [data-storage.md](../data-storage.md).

### Pagination metadata in context, releases in Jotai

**Decision:** `CollectionContext` tracks `totalItems` / fetch flags; the actual `DiscogsRelease[]` lives in atoms.

**Why:** Putting the full collection in context would force every context consumer to re-render on each page append. Atoms let list components subscribe narrowly.

### Server routes proxy Discogs with OAuth

**Decision:** Browser calls `api.collection`, not Discogs directly.

**Why:** OAuth signing stays server-side; rate limits and error shaping (502 → outage toast) stay centralized. See [api-and-discogs.md](api-and-discogs.md).

## Code snapshot: API entry (client)

All collection fetches go through the typed API object:

```ts
// src/api/urls.ts — pattern
export const api = {
  collection: (params: CollectionParams) =>
    collectionEndpoint.fetchCollection(params),
  // ...
};
```

Hooks wrap this:

```ts
const { data, fetchNextPage, hasNextPage } = useCollectionData({
  username,
  enabled: isAuthenticated,
});
```

## Code snapshot: thin server page

Collection route keeps SSR metadata on the server and static-imports the client shell (no `dynamic()` on core client chunks—Turbopack constraint):

```tsx
// src/app/collection/page.tsx (pattern)
import { ReleasesClient } from "src/components/ReleasesClient/ReleasesClient.component";

export default function CollectionPage() {
  return <ReleasesClient />;
}
```

## Related reading

- [architecture.md → Authenticated collection](../architecture.md)
- [patterns.md → Protected routes](../patterns.md)
- [conventions.md → Testing → Collection specs](../conventions.md#testing)