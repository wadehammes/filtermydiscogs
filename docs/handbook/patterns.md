# Patterns

Cross-cutting patterns for auth, global state, data fetching, filtering, and public pages—aligned with **rhythm-marketing** where the stack matches (API layer, React Query, constants).

## Provider stack

[`src/components/Providers.tsx`](../../src/components/Providers.tsx) nests providers in this order (outer → inner):

1. **QueryClientProvider** — TanStack Query defaults (10 min stale time, limited refetch).
2. **ThemeProvider** — light / dark / system preference.
3. **AuthProvider** — OAuth session state.
4. **CollectionContextProvider** — loaded releases and pagination.
5. **FiltersProvider** — style/year/format filters, sort, search, random mode.
6. **CrateProvider** — active crate and crate list.
7. **ViewProvider** — card vs table view preference.

When adding a new global concern, follow the same **context + useReducer + typed actions** pattern as existing files under [`src/context/`](../../src/context/).

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

1. **`CollectionContext`** holds **`allReleases`** from paginated Discogs fetches.
2. **`FiltersContext`** reducer calls pure helpers:
   - [`filterReleases.ts`](../../src/utils/filterReleases.ts)
   - [`sortReleases.ts`](../../src/utils/sortReleases.ts)
   - [`getAvailableStyles/Years/Formats`](../../src/utils/) for filter chip options
3. UI components (`FiltersBar`, `FiltersDrawer`) dispatch filter actions; **`filteredReleases`** drives tables, cards, mosaic input, and random release.

Add filter dimensions by extending reducer state, helpers, and UI—not by filtering ad hoc in leaf components.

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
- URL helpers: [`getSiteUrl`](../../src/utils/helpers.ts), [`envUrl`](../../src/utils/helpers.ts) for site base URLs.

## Admin dashboard

**`/admin`** is gated by **`ADMIN_USER_ID`** env matching the `discogs_user_id` cookie. Stats come from **`/api/admin/stats`** via **`useAdminStatsQuery`**.

## Testing

Jest layout, page objects, factories, and mock boundaries: **[conventions.md → Testing](conventions.md#testing)**.
