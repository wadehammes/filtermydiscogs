# Client state: Jotai, context, and React Query

## What users experience

- Filters (genre, format, year, search, sort) feel instant—they never wait on the network.
- Crates, playlists, and release detail **do** wait on the server, with loading states and cache reuse when you navigate back.
- Signing in/out resets some UI (drawer, collection sync) without wiping unrelated preferences.

## Moving parts

| Concern | Layer | Where |
| ------- | ----- | ----- |
| Filter inputs, derived release lists, view mode (grid/list/table) | **Jotai** | [`src/atoms/filters.atoms.ts`](../../../src/atoms/filters.atoms.ts), [`useFilterAtoms.hook.ts`](../../../src/hooks/useFilterAtoms.hook.ts) |
| OAuth session, “are we signed in?” | **Context + reducer** | [`auth.context.tsx`](../../../src/context/auth.context.tsx) |
| Collection **pagination** metadata (not the release array) | **Context + reducer** | [`collection.context.tsx`](../../../src/context/collection.context.tsx) |
| Crates, playlists, release detail from our API | **React Query** | [`src/hooks/queries/`](../../../src/hooks/queries/), [`src/hooks/mutations/`](../../../src/hooks/mutations/) |
| Active crate, drawer open state | **Context + React Query** | [`crate.context.tsx`](../../../src/context/crate.context.tsx) |

[`FiltersProvider`](../../../src/context/filters.context.tsx) and [`ViewProvider`](../../../src/context/view.context.tsx) are **scope markers** only—the real state lives in atoms.

## Decisions & rationale

### Jotai for filters and view mode

**Decision:** Store filter fields and derived lists in Jotai, with `atomWithStorage` for prefs that should survive refresh.

**Why:**

- Hundreds of components can subscribe to “filtered releases” without re-rendering the whole tree through one giant context value.
- Derived atoms (`filteredReleasesAtom`, sort pipelines) stay colocated with inputs; no manual `useMemo` chains in every consumer.
- Persisted keys are centralized in [`storageKeys.ts`](../../../src/constants/storageKeys.ts).

**Why not React Query for filters?** Filters run entirely on the client over the cached collection. There is no server “filter API”—sending every toggle to Postgres would be slow, costly, and wrong for offline-ish cache behavior.

### Context + reducer for auth and collection metadata

**Decision:** Keep session lifecycle and pagination counters in reducers, not Jotai.

**Why:**

- Fewer subscribers than filter atoms; updates are coarse-grained (login, logout, page loaded).
- Auth effects (cookie reads, redirect) fit naturally next to dispatch in the provider.
- Collection context intentionally holds **metadata only** (`totalItems`, `fetchingCollection`) so the release list can live in Jotai + IndexedDB without duplicating thousands of releases in context.

### React Query for server-backed data

**Decision:** All `api.*` reads/writes go through hooks with shared stale times and query keys.

**Why:**

- Dedupes identical requests when multiple components mount.
- Standard place for retries, invalidation after mutations, and optimistic updates (crate membership).
- Keeps components dumb: they call `useCrateQuery`, not `fetch('/api/...')`.

## Code snapshot: derived filters

Filters dispatch through a single atom action enum; derived atoms recompute when inputs change:

```ts
// Pattern (simplified) — see filters.atoms.ts for the full graph
import { atom } from "jotai";
import { allReleasesAtom, activeFiltersAtom } from "src/atoms/filters.atoms";

export const filteredReleasesAtom = atom((get) => {
  const releases = get(allReleasesAtom);
  const filters = get(activeFiltersAtom);
  return applyFiltersToReleases(releases, filters);
});
```

App code reads via hooks, not raw `useAtom` in feature components:

```ts
import { useFilteredReleases } from "src/hooks/useFilterAtoms.hook";

const releases = useFilteredReleases();
```

## Code snapshot: query key + hook

```ts
// hooks/queries/usePublicPlaylistQuery.ts (pattern)
export const usePublicPlaylistQuery = (playlistId: string, options?) =>
  useQuery({
    queryKey: PublicPlaylistQueryKeys.detail(playlistId),
    queryFn: () => api.publicPlaylist(playlistId),
    ...options,
  });
```

Components never import `api` directly for reads—hooks own cache keys and enabled flags.

## When to add new state

Use [decisions.md → Client state and data](../decisions.md#client-state-and-data):

- Many subscribers, pure derivation → **Jotai**
- Session / wizard with effects → **context**
- Postgres or Discogs via our API → **React Query**

See also [patterns.md → Provider stack](../patterns.md#provider-stack) for mount order.