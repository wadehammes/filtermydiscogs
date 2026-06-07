# Patterns

Cross-cutting patterns for auth, global state, data fetching, filtering, and public pages.

## Provider stack

[`src/components/Providers.tsx`](../../src/components/Providers.tsx) nests providers in this order (outer → inner):

1. **QueryClientProvider** — TanStack Query defaults (10 min stale time, limited refetch).
2. **JotaiProvider** — shared Jotai store for client UI state ([`src/atoms/JotaiProvider.tsx`](../../src/atoms/JotaiProvider.tsx)).
3. **ThemeProvider** — light / dark / system preference.
4. **AuthProvider** — OAuth session state.
5. **CollectionContextProvider** — loaded releases and pagination.
6. **FiltersProvider** — scope marker for filter hooks (state lives in [`src/atoms/filters.atoms.ts`](../../src/atoms/filters.atoms.ts)).
7. **CrateProvider** — active crate and crate list.
8. **ViewProvider** — scope marker for view hooks (state in [`src/atoms/view.atoms.ts`](../../src/atoms/view.atoms.ts)).

**Jotai** backs **filters** and **view** preference state. Atoms and derived selectors live under [`src/atoms/`](../../src/atoms/); [`src/context/filters.context.tsx`](../../src/context/filters.context.tsx) and [`view.context.tsx`](../../src/context/view.context.tsx) expose scope markers and legacy `useFilters()` / `useView()` for full state. Prefer granular hooks from [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts) so components subscribe only to the slice they need (for example `useSelectedStyles()`, `useFilteredReleases()`, `useCurrentView()`).

**Auth**, **collection**, **crate**, and **theme** still use React context. When adding a new global concern, use **Jotai** for derived client UI state with many subscribers; use **context + reducer** (or React Query) for session lifecycle, server-backed data, or side-effect-heavy flows.

## Authentication flow

1. **Start OAuth**: client navigates to **`GET /api/auth/discogs`**, which redirects to Discogs authorize URL and stores temporary request tokens in cookies.
2. **Callback**: **`GET /api/auth/callback`** exchanges verifier for access token, calls **`getIdentity`**, sets cookies, redirects to **`/releases?auth=success`**.
3. **Session check**: **`AuthProvider`** calls **`/api/auth/check`** on mount and reads **`discogs_username`** via [`auth.service.ts`](../../src/services/auth.service.ts).
4. **Logout**: **`/api/auth/logout`** clears cookies; client dispatches logout actions and shows **`LogoutOverlay`**.

Cookie names and security flags: [discogs.md](discogs.md).

## API layer

Route outbound browser HTTP through **[`src/api/helpers.ts`](../../src/api/helpers.ts)**—the single front door for collection pages, crates, search, auth check, and dashboard stats.

- **Do not** call Discogs or `/api/...` with raw **`fetch`** from components or query hook files.
- **Do not** call Discogs directly from the browser; route handlers sign OAuth requests server-side.
- **Adding a new endpoint**: (1) Add a typed helper in `src/api/helpers.ts`. (2) Add or extend a route handler under `src/app/api/`. (3) Add a dedicated hook under `src/hooks/queries/` that calls the helper in `queryFn`.

## React Query

- **Provider**: [`Providers.tsx`](../../src/components/Providers.tsx) creates **`QueryClient`** and wraps the tree.
- **Hooks**: [`src/hooks/queries/`](../../src/hooks/queries/) — one file per query or mutation bundle.
- **Query keys**: [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts) — use factories everywhere (hooks, invalidation, optimistic cache keys).

| Hook | Key factory | Purpose |
|------|-------------|---------|
| `useDiscogsCollectionQuery` | `DiscogsCollectionQueryKeys.byUsername` | Infinite collection pages |
| `useCollectionFieldsQuery` | `CollectionFieldsQueryKeys.byUsername` | Discogs collection custom-field definitions (notes editor) |
| `useCollectionValueQuery` | `CollectionValueQueryKeys.byUsername` | Collection dollar value |
| `useDiscogsReleaseQuery` | `DiscogsReleaseQueryKeys.byId` | Single release fetch |
| `useCratesQuery` / `useCrateQuery` | `CratesQueryKeys` / `CrateQueryKeys` | Crate list and detail |
| `usePublicCrateQuery` | `PublicCrateQueryKeys.byId` | Public crate page |
| `useMostCratedQuery` | `MostCratedQueryKeys.list` | Dashboard stats |
| `useAdminStatsQuery` | `AdminStatsQueryKeys.all` | Admin dashboard |

Hook rules (single params object, no side effects in hook files): [conventions.md → React Query](conventions.md#react-query).

**`useCollectionData`** composes auth state + collection query + context dispatch for the releases/dashboard pages. Invalidate with **`DiscogsCollectionQueryKeys`** when the username changes ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts), [`auth.context.tsx`](../../src/context/auth.context.tsx)).

**Mutations**: [`useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts) — optimistic updates use the same **`CrateQueryKeys`** / **`CratesQueryKeys`** as queries.

## Filtering and sorting

1. **`useCollectionData`** loads paginated Discogs pages and writes releases once via **`FiltersActionTypes.SetAllReleases`** → **`allReleasesAtom`** (single source of truth). Collection context keeps pagination metadata (`collection`, `fetchingCollection`, `error`) only—not a duplicate release list.
2. **Filter atoms** ([`filters.atoms.ts`](../../src/atoms/filters.atoms.ts)) derive **`filteredReleases`** from filter inputs via:
   - [`filterReleases.ts`](../../src/utils/filterReleases.ts)
   - [`sortReleases.ts`](../../src/utils/sortReleases.ts)
   - [`getAvailableStyles/Years/Formats`](../../src/utils/) for filter chip options
3. UI components (`FiltersBar`, `FiltersDrawer`, release pills) dispatch filter actions through **`useFiltersDispatch()`** and read state via **`useFilterAtoms`** hooks; **`useFilteredReleases()`** / **`useMemoizedFilteredReleases()`** drive tables, cards, mosaic input, and random release. Dashboard/analytics read the same list via **`useAllReleases()`**.

**Lint guardrails**: Biome **`noRestrictedImports`** blocks **`useFilters`** / **`useView`** in `src/components/**`—use **`useFilterAtoms`** / **`useViewAtoms`** instead. Context modules and tests are exempt.

Add filter dimensions by extending filter atoms/helpers and UI—not by filtering ad hoc in leaf components. Release note text is included in search via **`getReleaseNotesSearchText`** in [`filterReleases.ts`](../../src/utils/filterReleases.ts).

## Collection notes (scoped provider)

Release-card notes use a **feature-local provider**, not a global entry in **`Providers.tsx`**:

1. **`ReleaseNotesEditorProvider`** wraps each **`ReleaseCard`** / **`MobileReleaseCard`** and calls **`useReleaseNotesEditor(release)`** once.
2. **`ReleaseNotes`** (`displayOnly`) and **`ReleaseNotesCardAction`** read **`useReleaseNotesEditorContext()`** so the body, **Add notes** link, and icon open the same **`NoteEditDialog`**.
3. Saves go through **`updateCollectionNote`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) → **`POST /api/collection/instances/.../fields/...`** → **`discogsOAuthService.updateCollectionInstanceField`**.

Colocate feature hooks under the component folder ([`useReleaseNotesEditor.hook.ts`](../../src/components/ReleaseNotes/useReleaseNotesEditor.hook.ts)); keep shared React Query hooks in [`src/hooks/queries/`](../../src/hooks/queries/).

## Crates

- **Client**: `CrateProvider` + **`useCrateMutations`** talk to **`/api/crates`** via **`src/api/helpers.ts`**.
- **Server**: handlers scope all rows by **`discogs_user_id`** cookie; store optional **`username`** on public crates.
- **Public view**: [`/crate/[id]`](../../src/app/crate/[id]/page.tsx) uses **`fetchPublicCrateMetadata`** for SEO and **`usePublicCrateQuery`** for client data.

See [database.md](database.md) for schema details.

## Metadata and OG images

- Root metadata defaults in [`src/app/layout.tsx`](../../src/app/layout.tsx).
- Per-route metadata in `page.tsx` files (e.g. public crate title/description).
- Dynamic OG routes: [`src/app/opengraph-image.tsx`](../../src/app/opengraph-image.tsx), [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx).

Use the **`/opengraph-image`** route path in metadata (not `.png`) for App Router dynamic OG images.

## Constants and env

- Shared literals (sort values, storage keys) live in [`src/constants.ts`](../../src/constants.ts)—not magic strings in components.
- Runtime **`process.env.*`** keys that must reach the browser need to be listed under **`env`** in [`next.config.ts`](../../next.config.ts). OAuth secrets stay **server-only** unless intentionally exposed for OAuth initiation.
- URL helpers: [`getSiteUrl`](../../src/utils/helpers.ts) for site base URLs.

## Admin dashboard

**`/admin`** is gated by **`ADMIN_USER_ID`** env matching the `discogs_user_id` cookie. Stats come from **`/api/admin/stats`** via **`useAdminStatsQuery`**.

## Testing

Jest layout, page objects, factories, and mock boundaries: **[conventions.md → Testing](conventions.md#testing)**.
