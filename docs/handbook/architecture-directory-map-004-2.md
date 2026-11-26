### [`src/atoms/`](../../src/atoms/)

**Jotai** client UI state:
- [`filters.atoms.ts`](../../src/atoms/filters.atoms.ts) — `allReleasesAtom`, filter inputs (`atomWithStorage` → **`filtermydiscogs_filters`**), derived `filteredReleasesAtom`, `filtersDispatchAtom`.
- [`view.atoms.ts`](../../src/atoms/view.atoms.ts) — card / list / random view preference (`atomWithStorage` with **`getOnInit: true`**); client helpers in [`collectionViewModeStorage.ts`](../../src/utils/collectionViewModeStorage.ts) (`readInitialCollectionViewMode`, **`syncCollectionViewCookie`**) and server **`readSsrCollectionView`** ([`readSsrCollectionView.server.ts`](../../src/utils/readSsrCollectionView.server.ts)); **`filtermydiscogs_view`** cookie + generated **`/theme-init.js`** **`data-collection-view`** so **[`collection/loading.tsx`](../../src/app/collection/loading.tsx)** and **`collection/page.tsx`** Suspense SSR the correct **[`ReleasesPageLoading`](../../src/components/ReleasesClient/ReleasesPageLoading.component.tsx)** skeleton; list mode renders [`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx) on desktop.
- [`JotaiProvider.tsx`](../../src/atoms/JotaiProvider.tsx) — shared store for the app tree.

Prefer **`useFilterAtoms`** / **`useViewAtoms`** in app code. Biome restricts **`useFilters()`** / **`useView()`** outside context modules and tests (see [conventions.md](conventions.md)).

### [`src/context/`](../../src/context/)

Global providers that are **not** Jotai-backed:

| Module                                                               | Role                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`auth.context.tsx`](../../src/context/auth.context.tsx)             | OAuth session (`useReducer`)                                                    |
| [`collection.context.tsx`](../../src/context/collection.context.tsx) | Collection pagination metadata only (`useReducer`); release list lives in Jotai |
| [`crate.context.tsx`](../../src/context/crate.context.tsx)           | Active crate, drawer, mutations (React Query)                                   |
| [`theme.context.tsx`](../../src/context/theme.context.tsx)           | Light/dark/system theme                                                         |
| [`filters.context.tsx`](../../src/context/filters.context.tsx)       | Scope marker; state lives in Jotai                                              |
| [`view.context.tsx`](../../src/context/view.context.tsx)             | Scope marker; state lives in Jotai                                              |

See [patterns.md](patterns.md). **`collection.context.tsx`** holds pagination metadata only (`collection`, `fetchingCollection`, `error`); release lists and filters live in Jotai.

### [`src/constants/`](../../src/constants/)

Topic-specific constants alongside root [`src/constants.ts`](../../src/constants.ts): [`sortValues.ts`](../../src/constants/sortValues.ts) (`SortValues` enum), [`sorting.ts`](../../src/constants/sorting.ts) (sort UI labels), [`storageKeys.ts`](../../src/constants/storageKeys.ts) (shared `localStorage` keys), [`mosaic.ts`](../../src/constants/mosaic.ts), [`collection.ts`](../../src/constants/collection.ts) (adaptive collection page sizes).

### [`src/services/`](../../src/services/)

- [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) — server-side OAuth signing and Discogs API calls.
- [`auth.service.ts`](../../src/services/auth.service.ts) — client-side cookie reads and auth URL param parsing.

Details: [discogs.md](discogs.md).

### [`src/api/`](../../src/api/) and [`src/app/api/`](../../src/app/api/)

- **[`src/api/urls.ts`](../../src/api/urls.ts)** — **`api`** object: single front door for client `/api/...` calls.
- **[`src/api/endpoints/`](../../src/api/endpoints/)** — per-domain fetch implementations (`collection.ts`, `crates.ts`, …).
- **[`src/api/helpers.ts`](../../src/api/helpers.ts)** — `fetchOptions`, `fetchResponse` for consistent headers and JSON responses.
- **[`src/api/types.ts`](../../src/api/types.ts)** — re-exports cross-module API types (endpoint-specific shapes stay in `endpoints/*.ts`).
- Route handlers under `src/app/api/` implement authenticated Discogs proxying and crate persistence.

### [`src/hooks/`](../../src/hooks/)

Custom hooks and React Query hooks under [`hooks/queries/`](../../src/hooks/queries/) (reads) and [`hooks/mutations/`](../../src/hooks/mutations/) (writes). Notable feature hooks: [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts), [`useCollectionAnalytics`](../../src/hooks/useCollectionAnalytics.hook.ts), [`useCollectionReset`](../../src/hooks/useCollectionReset.hook.ts), [`useMosaicGenerator`](../../src/hooks/useMosaicGenerator.hook.ts).

### [`src/lib/`](../../src/lib/)

Server utilities: [`discogs-username.ts`](../../src/lib/discogs-username.ts), [`api-helpers.ts`](../../src/lib/api-helpers.ts) (verified OAuth + rate limit), [`private-route-response.ts`](../../src/lib/private-route-response.ts), [`public-crate.server.ts`](../../src/lib/public-crate.server.ts), [`public-stats.server.ts`](../../src/lib/public-stats.server.ts), rate limiting, admin helpers, Prisma client ([`db.ts`](../../src/lib/db.ts)). Network proxy: [`src/proxy.ts`](../../src/proxy.ts) (see [platform.md](platform.md)).

### [`src/utils/`](../../src/utils/)

Pure helpers: filtering, sorting, format/year/style availability, sync helpers, [`imageLoader.ts`](../../src/utils/imageLoader.ts) (mosaic + image proxy).

### [`src/tests/`](../../src/tests/)

Factories (`src/tests/factories/`), test providers, shared mocks.

