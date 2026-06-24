# Patterns

Cross-cutting patterns for auth, global state, data fetching, filtering, and public pages.

## Provider stack

[`src/components/Providers.tsx`](../../src/components/Providers.tsx) nests providers in this order (outer → inner):

1. **QueryClientProvider** — TanStack Query defaults (10 min stale time, limited refetch).
2. **JotaiProvider** — shared Jotai store for client UI state ([`src/atoms/JotaiProvider.tsx`](../../src/atoms/JotaiProvider.tsx)).
3. **ThemeProvider** — light / dark / system preference.
4. **AuthProvider** — OAuth session state.
5. **CollectionContextProvider** — collection pagination metadata only (not the release list).
6. **FiltersProvider** — scope marker for filter hooks (state lives in [`src/atoms/filters.atoms.ts`](../../src/atoms/filters.atoms.ts)).
7. **CrateProvider** — active crate and crate list.
8. **ViewProvider** — scope marker for view hooks (state in [`src/atoms/view.atoms.ts`](../../src/atoms/view.atoms.ts)).

Inside **ViewProvider**: **`LogoutOverlayWrapper`** and **`AuthCheckingToast`**. **`AppToaster`** (Sonner) is a sibling under **ThemeProvider**, outside the auth subtree.

**Jotai** backs **filters** and **view** preference state. Atoms and derived selectors live under [`src/atoms/`](../../src/atoms/); [`src/context/filters.context.tsx`](../../src/context/filters.context.tsx) and [`view.context.tsx`](../../src/context/view.context.tsx) expose scope markers and legacy `useFilters()` / `useView()` for full state. Prefer granular hooks from [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts) so components subscribe only to the slice they need (for example `useSelectedStyles()`, `useFilteredReleases()`, `useCurrentView()`).

**Auth**, **collection**, **crate**, and **theme** still use React context. When adding a new global concern, use **Jotai** for derived client UI state with many subscribers; use **context + reducer** (or React Query) for session lifecycle, server-backed data, or side-effect-heavy flows.

## Authentication flow

1. **Start OAuth**: client navigates to **`GET /api/auth/discogs?force=1`**, which clears any prior session, redirects to Discogs authorize URL, and stores temporary request tokens in cookies.
2. **Callback**: **`GET /api/auth/callback`** exchanges verifier for access token, calls **`getIdentity`**, sets cookies, redirects to **`/releases?auth=success`**.
3. **Session check**: **`useAuthQuery`** ([`src/hooks/queries/useAuthQuery.ts`](../../src/hooks/queries/useAuthQuery.ts)) fetches **`/api/auth/check`** via **`checkAuth`** in [`src/api/helpers.ts`](../../src/api/helpers.ts). **`AuthProvider`** derives **`isAuthenticated`**, **`username`**, **`userId`**, **`rateLimited`**, and **`isCheckingAuth`** from that query. When Discogs is rate-limited, the check may return cookie-based identity with **`rateLimited: true`**; the query refetches every 60s (and on window focus) until verification succeeds; collection and crate queries stay disabled meanwhile. On OAuth success, **`refetch`** + **`clearUserScopedQueries`** reset cached user data; **`CrateProvider`** waits until **`isCheckingAuth`** is false before enabling crate queries (avoids a race with that cache clear), resets **`activeCrateId`** when **`userId`** changes, calls **`resetDrawer()`** on first login (null → user id) so the crate drawer follows viewport defaults, **`closeDrawer()`** on logout or user switch, and logs out if crate **`user_id`** does not match the session. Context reducer state is UI-only (**`isLoading`**, **`isLoggingOut`**, OAuth URL **`error`**). **`isLoading`** is reserved for an in-flight OAuth redirect after **Connect with Discogs**. The home page renders the landing immediately while **`isCheckingAuth`** runs, shows a subtle Sonner toast (**`AuthCheckingToast`**) while the session is verified, and redirects authenticated users to **`/releases`** when the check completes.
4. **Logout**: **`POST /api/auth/logout`** clears session cookies by default (full logout). Pass **`?preserve_tokens=true`** to keep OAuth tokens for quick re-login. Client dispatches logout actions and shows **`LogoutOverlay`**.

Cookie names and security flags: [discogs.md](discogs.md).

## Protected routes

Authenticated app routes use [`useRedirectIfUnauthenticated`](../../src/hooks/useRedirectIfUnauthenticated.hook.ts): while **`isCheckingAuth`**, render nothing briefly; when unauthenticated, **`router.replace("/")`**. While a page or its collection is loading, show [`AppPageLoading`](../../src/components/AppPageLoading/AppPageLoading.component.tsx) with page-specific copy (**Loading releases…**, **Loading dashboard…**, **Loading mosaic…**). Collection loading UI uses [`useNeedsCollectionLoad`](../../src/hooks/useNeedsCollectionLoad.hook.ts) so cached releases skip the spinner when navigating between app pages.

| Route | While `isCheckingAuth` | When unauthenticated | Collection loading |
|-------|------------------------|----------------------|--------------------|
| `/` | Landing + toast | Landing | — |
| `/releases` | Header + loader (first load only) | Redirect to `/` | Skip when releases already in Jotai |
| `/dashboard`, `/mosaic` | Header + skeleton/loader (first load only) | Redirect to `/` | Skip when releases already in Jotai |
| `/admin` | Server gate + brief null | Redirect to `/` | — |

Authenticated app routes use segment **`loading.tsx`** with **`AppPageLoading`** ( **`StickyHeaderBar`**, not **`PublicAuthLayout`** ). Root [`loading.tsx`](../../src/app/loading.tsx) switches to the same shell when the user is authenticated on `/releases`, `/dashboard`, `/mosaic`, or `/admin`.

## Public pages

Server `page.tsx` files for home, about, legal, and public crates share one client shell:

1. **`PublicAuthLayout`** — header (`PublicAuthHeader` → `PublicPageHeader` or authenticated `StickyHeaderBar`), `<main>`, optional `footer`.
2. **`PageFooter`** (server component) — community stats (`PageFooterStats` / `PageFooterFun`) plus About / Contribute links. Pass as the layout `footer` prop from each `page.tsx`.
3. **Page content** — e.g. [`Login`](../../src/components/Login/Login.component.tsx) on `/`, `AboutClient` / `LegalClient`, or public crate client.

Home renders the landing immediately during **`isCheckingAuth`**; authenticated users redirect from `Login` via `router.replace("/releases")`. Protected app routes use **`AppPageLoading`** (see Protected routes above), not a blocking auth shell on `/`.

## API layer

Route outbound browser HTTP through **[`src/api/helpers.ts`](../../src/api/helpers.ts)**—the single front door for collection, crates, search, release fetch, auth check/logout/clear-data, and dashboard stats.

- **Do not** call Discogs or `/api/...` with raw **`fetch`** from components or query hook files.
- **Do not** call Discogs directly from the browser; route handlers sign OAuth requests server-side.
- **Adding a new endpoint**: (1) Add a typed helper in `src/api/helpers.ts`. (2) Add or extend a route handler under `src/app/api/`. (3) Add a dedicated hook under `src/hooks/queries/` that calls the helper in `queryFn`.

## React Query

- **Provider**: [`Providers.tsx`](../../src/components/Providers.tsx) creates **`QueryClient`** and wraps the tree.
- **Hooks**: [`src/hooks/queries/`](../../src/hooks/queries/) — one file per query or mutation bundle.
- **Query keys**: [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts) — use factories everywhere (hooks, invalidation, optimistic cache keys).

| Hook | Key factory | Purpose |
|------|-------------|---------|
| `useAuthQuery` | `AuthQueryKeys.all` | Session check (`/api/auth/check`) |
| `useDiscogsCollectionQuery` | `DiscogsCollectionQueryKeys.byUsername` | Infinite collection pages |
| `useCollectionFieldsQuery` | `CollectionFieldsQueryKeys.byUsername` | Discogs collection custom-field definitions (notes editor) |
| `useCollectionValueQuery` | `CollectionValueQueryKeys.byUsername` | Collection dollar value |
| `useDiscogsReleaseQuery` | `DiscogsReleaseQueryKeys.byId` | Single release fetch |
| `useCratesQuery` / `useCrateQuery` | `CratesQueryKeys` / `CrateQueryKeys` | Crate list and detail (`useCrateQuery` is exported from [`useCratesQuery.ts`](../../src/hooks/queries/useCratesQuery.ts)) |
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

**Lint guardrails**: Biome **`noRestrictedImports`** discourages **`useFilters`** / **`useView`** in application code—prefer **`useFilterAtoms`** / **`useViewAtoms`**. Context modules and test files are exempt.

Add filter dimensions by extending filter atoms/helpers and UI—not by filtering ad hoc in leaf components. Release note text is included in search via **`getReleaseNotesSearchText`** in [`filterReleases.ts`](../../src/utils/filterReleases.ts).

## Collection notes (scoped provider)

Release-card notes use a **feature-local provider**, not a global entry in **`Providers.tsx`**:

1. **`ReleaseNotesEditorProvider`** wraps each **`ReleaseCard`** / **`MobileReleaseCard`** and calls **`useReleaseNotesEditor(release)`** once.
2. **`ReleaseNotes`** (`displayOnly`) and **`ReleaseNotesCardAction`** read **`useReleaseNotesEditorContext()`** so the body, **Add notes** link, and icon open the same **`NoteEditDialog`**.
3. Saves go through **`updateCollectionNote`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) → **`POST /api/collection/instances/.../fields/...`** → **`discogsOAuthService.updateCollectionInstanceField`**.

Colocate feature hooks under the component folder ([`useReleaseNotesEditor.hook.ts`](../../src/components/ReleaseNotes/useReleaseNotesEditor.hook.ts)); keep shared React Query hooks in [`src/hooks/queries/`](../../src/hooks/queries/).

## Crates

- **Client**: `CrateProvider` + **`useCrateMutations`** talk to **`/api/crates`** via **`src/api/helpers.ts`**. Components call **`useCrate()`** actions (`updateCrate`, `createCrate`, …) — not mutation hooks directly. Mutation **`onError`** handlers in **`useCrateMutations`** show Sonner toasts and roll back optimistic cache updates; UI handlers only await success and update local dialog state. Crate list (`useCratesQuery`) and active crate releases (`useCrateQuery`) are separate queries — both stay disabled while **`isCheckingAuth`** or **`rateLimited`**; on first login, **`CrateProvider`** invalidates both after **`userId`** arrives, re-selects the default crate, and refetches detail (dropping cached detail first) if list **`releaseCount`** and loaded releases disagree.
- **UI**: [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) sidebar on desktop (≥1024px) and bottom drawer on mobile. **`CrateDrawerProvider`** ([`CrateDrawer.context.tsx`](../../src/components/CrateDrawer/CrateDrawer.context.tsx)) wraps the drawer shell and calls **`useCrateDrawerState`** once; footer, releases list, and confirm/edit dialogs read **`useCrateDrawerContext()`** (same feature-local provider pattern as **`ReleaseNotesEditorProvider`**). **Open/closed state** lives in [`useCrateDrawer`](../../src/hooks/useCrateDrawer.hook.ts): `isDrawerOpen = userToggled ?? isDesktop` (open on desktop, closed on mobile). Use **`openDrawer()`** / **`closeDrawer()`** for explicit user actions; **`resetDrawer()`** clears `userToggled` back to viewport default (login, not duplicate `useMediaQuery` checks in **`CrateProvider`**). **`addToCrate`** opens the drawer only when **`isDesktop`**. Layout shell (sidebar vs bottom drawer) still uses **`useMediaQuery("(max-width: 1023px)")`** in **`CrateDrawer`** — same **1024px** cutoff. After OAuth login, **`CrateProvider`** calls **`resetDrawer()`**; logout/user switch calls **`closeDrawer()`**. [`CrateSelector`](../../src/components/CrateSelector/CrateSelector.component.tsx) (dropdown + circular **New Crate** button), footer actions, [`EditCrateDialog`](../../src/components/EditCrateDialog/EditCrateDialog.component.tsx) modal (rename + type-to-confirm delete). Submit-style crate forms use **React Hook Form** ([conventions.md](conventions.md)).
- **Server**: handlers scope all rows by **verified OAuth user ID** from **`getVerifiedUserFromRequestWithRateLimit`**; store optional **`username`** on public crates.
- **Public view**: [`/crate/[id]`](../../src/app/crate/[id]/page.tsx) loads SEO metadata via **`fetchPublicCrateMetadata`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts) → [`public-crate.server.ts`](../../src/lib/public-crate.server.ts)) and client data via **`usePublicCrateQuery`**.

See [database.md](database.md) for schema details.

## Dashboard analytics

- **Page**: [`/dashboard`](../../src/app/dashboard/page.tsx) → [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx).
- **Data**: **`useAllReleases()`** from Jotai + **`useCollectionAnalytics`** for computed stats; **`useCollectionValueQuery`** for Discogs collection dollar value; **Recharts** for charts.
- **Types**: [`src/types/dashboard.types.ts`](../../src/types/dashboard.types.ts).

## Mosaic generator

- **Page**: [`/mosaic`](../../src/app/mosaic/page.tsx) → [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) (client `dynamic` with `ssr: false`; [`AppPageLoading`](../../src/components/AppPageLoading/AppPageLoading.component.tsx) while the chunk loads) → [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx).
- **Hook**: [`useMosaicGenerator`](../../src/hooks/useMosaicGenerator.hook.ts) builds canvas grids from filtered releases.
- **Images**: [`src/utils/imageLoader.ts`](../../src/utils/imageLoader.ts) fetches resized covers via **`GET /api/image-proxy`** (Sharp server-side).

## Clear stored data

About/Legal **Clear stored data** calls **`clearData`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) → **`POST /api/auth/clear-data`**, which deletes the user's crates and clears session cookies. Client reset uses **`useCollectionReset`** ([`useCollectionReset.hook.ts`](../../src/hooks/useCollectionReset.hook.ts)).

## Metadata and OG images

- Root metadata defaults in [`src/app/layout.tsx`](../../src/app/layout.tsx).
- Per-route metadata in `page.tsx` files (e.g. public crate title/description).
- Default social images: static [`opengraph-image.png`](../../src/app/opengraph-image.png) and [`twitter-image.png`](../../src/app/twitter-image.png) in `src/app/` with matching [`opengraph-image.alt.txt`](../../src/app/opengraph-image.alt.txt) / [`twitter-image.alt.txt`](../../src/app/twitter-image.alt.txt). Shared alt text and metadata objects live in [`src/constants.ts`](../../src/constants.ts) (`DEFAULT_OPEN_GRAPH_IMAGE`, `DEFAULT_TWITTER_IMAGE`). Per-route metadata references those constants with `metadataBase` from [`layout.tsx`](../../src/app/layout.tsx).
- Dynamic OG routes: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx) for public crate shares.

Do not add a dynamic `opengraph-image.tsx` alongside the PNG; the code route overrides the static file and replaces the app preview art.

## Constants and env

- Shared literals live in [`src/constants.ts`](../../src/constants.ts) and topic files under [`src/constants/`](../../src/constants/) (e.g. **`SortValues`**, mosaic sizes)—not magic strings in components.
- Runtime **`process.env.*`** keys that must reach the browser need to be listed under **`env`** in [`next.config.ts`](../../next.config.ts). OAuth secrets stay **server-only** unless intentionally exposed for OAuth initiation.
- URL helpers: [`getSiteUrl`](../../src/utils/helpers.ts) for site base URLs.

## Admin dashboard

**`/admin`** is gated by **`ADMIN_USER_ID`** env matching the `discogs_user_id` cookie. Stats come from **`/api/admin/stats`** via **`useAdminStatsQuery`**.

## Testing

Jest layout, page objects, factories, and mock boundaries: **[conventions.md → Testing](conventions.md#testing)**.
