# Architecture

Map of FilterMyDisco.gs: technologies, top-level folders, and how Discogs collection data and Postgres crates reach the browser.

## Tech stack

- **Framework**: **Next.js 16** with the **App Router**. Routes and layouts live under [`src/app/`](../../src/app/).
- **UI**: React 19, TypeScript.
- **Auth & data source**: **Discogs OAuth 1.0a** and the Discogs REST API via [`src/services/discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts).
- **Persistence**: **Prisma 7** + **Vercel Postgres** for user crates and saved releases ([`prisma/schema.prisma`](../../prisma/schema.prisma), datasource URL in [`prisma.config.ts`](../../prisma.config.ts)).
- **Client state**:
  - **Jotai** — filters, view mode, and derived release lists ([`src/atoms/`](../../src/atoms/)); components subscribe via [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts).
  - **React Context** — auth and collection pagination (**useReducer**); crate drawer/selection (**React Query** + local state); theme (**useState**). [`FiltersProvider`](../../src/context/filters.context.tsx) and [`ViewProvider`](../../src/context/view.context.tsx) are scope markers over Jotai, not duplicate state.
  - **TanStack React Query** — server-backed data (collection pages, crate mutations, dashboard stats, public crates).
- **Forms**: **React Hook Form** for submit-style dialogs and create/edit flows (see [conventions.md](conventions.md)).
- **UI libraries**: **TanStack Table** (releases list), **Recharts** (dashboard), **Sonner** (toasts), **Sharp** (image proxy for mosaic).
- **Styling**: **CSS Modules** (`.module.css`) plus global styles and theme tokens under [`src/styles/`](../../src/styles/).
- **Tooling**: **pnpm**, **Biome**, **Stylelint**, **Jest** + Testing Library, **Knip** (unused-code detection in CI).

## Directory map

### [`src/app/`](../../src/app/)

Next.js routes, layouts, and **Route Handlers** under `app/api/`.

- **Pages**: [`page.tsx`](../../src/app/page.tsx) (login/home), [`releases/`](../../src/app/releases/), [`dashboard/`](../../src/app/dashboard/), [`mosaic/`](../../src/app/mosaic/), [`crate/[id]/`](../../src/app/crate/[id]/), [`about/`](../../src/app/about/), [`legal/`](../../src/app/legal/), [`admin/`](../../src/app/admin/).
- **API**: Discogs proxy (`collection`, `collection/fields`, `collection/value`, `collection/instances/...`, `search`, `release/[id]`), auth (`auth/discogs`, `auth/callback`, `auth/check`, `auth/logout`, `auth/clear-data`), crate CRUD under `crates/`, `image-proxy`, `dashboard/most-crated`, admin stats, dynamic OG (`og/crate/[id]`).
- **Root layout**: [`layout.tsx`](../../src/app/layout.tsx) — fonts, metadata defaults, `Providers`, Google Tag Manager.
- **Root error UI**: [`error.tsx`](../../src/app/error.tsx) (under Providers). [`global-error.tsx`](../../src/app/global-error.tsx) replaces the root layout — own `html`/`body`, no Providers.
- **Root loading**: [`loading.tsx`](../../src/app/loading.tsx) — provider-free **`PageLoader`** only (Next also mounts it under `/_global-error`). Authenticated shells use segment [`releases/loading.tsx`](../../src/app/releases/loading.tsx), [`dashboard/loading.tsx`](../../src/app/dashboard/loading.tsx), [`mosaic/loading.tsx`](../../src/app/mosaic/loading.tsx).

Most feature pages are **client components** (`*Client.tsx`) wrapped by thin server `page.tsx` shells that set metadata. Mosaic uses [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) (`ssr: false` must live in a client component) with [`AppPageLoading`](../../src/components/AppPageLoading/AppPageLoading.component.tsx) while the chunk loads.

### [`src/components/`](../../src/components/)

Feature UI: one folder per area (e.g. `Dashboard`, `ReleaseCard`, `StickyHeaderBar`, `PublicAuthLayout`). See [components.md](components.md).

**Public auth shell**: [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) wraps home, about, legal, and public crate pages.

**Authenticated shells**: [`ReleasesClient`](../../src/components/ReleasesClient/ReleasesClient.component.tsx) (primary collection UI), [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx), [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx), [`AdminDashboardClient`](../../src/components/AdminDashboard/AdminDashboardClient.component.tsx).

[`Providers.tsx`](../../src/components/Providers.tsx) wires **QueryClient**, **JotaiProvider**, theme, auth, collection, filters, crate, and view providers. **`AppToaster`** (Sonner) sits under `ThemeProvider`; **`AuthCheckingToast`** and **`LogoutOverlay`** render inside the view subtree. See [patterns.md → Provider stack](patterns.md#provider-stack).

### [`src/atoms/`](../../src/atoms/)

**Jotai** client UI state:

- [`filters.atoms.ts`](../../src/atoms/filters.atoms.ts) — `allReleasesAtom`, filter inputs (`atomWithStorage` → **`filtermydiscogs_filters`**), derived `filteredReleasesAtom`, `filtersDispatchAtom`.
- [`view.atoms.ts`](../../src/atoms/view.atoms.ts) — card / list / random view preference (`atomWithStorage`); list mode renders [`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx) on desktop.
- [`JotaiProvider.tsx`](../../src/atoms/JotaiProvider.tsx) — shared store for the app tree.

Prefer **`useFilterAtoms`** / **`useViewAtoms`** in app code. Biome restricts **`useFilters()`** / **`useView()`** outside context modules and tests (see [conventions.md](conventions.md)).

### [`src/context/`](../../src/context/)

Global providers that are **not** Jotai-backed:

| Module | Role |
|--------|------|
| [`auth.context.tsx`](../../src/context/auth.context.tsx) | OAuth session (`useReducer`) |
| [`collection.context.tsx`](../../src/context/collection.context.tsx) | Collection pagination metadata only (`useReducer`); release list lives in Jotai |
| [`crate.context.tsx`](../../src/context/crate.context.tsx) | Active crate, drawer, mutations (React Query) |
| [`theme.context.tsx`](../../src/context/theme.context.tsx) | Light/dark/system theme |
| [`filters.context.tsx`](../../src/context/filters.context.tsx) | Scope marker; state lives in Jotai |
| [`view.context.tsx`](../../src/context/view.context.tsx) | Scope marker; state lives in Jotai |

See [patterns.md](patterns.md). **`collection.context.tsx`** holds pagination metadata only (`collection`, `fetchingCollection`, `error`); release lists and filters live in Jotai.

### [`src/constants/`](../../src/constants/)

Topic-specific constants alongside root [`src/constants.ts`](../../src/constants.ts): [`sortValues.ts`](../../src/constants/sortValues.ts) (`SortValues` enum), [`sorting.ts`](../../src/constants/sorting.ts) (sort UI labels), [`storageKeys.ts`](../../src/constants/storageKeys.ts) (shared `localStorage` keys), [`mosaic.ts`](../../src/constants/mosaic.ts), [`collection.ts`](../../src/constants/collection.ts) (adaptive collection page sizes).

### [`src/services/`](../../src/services/)

- [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) — server-side OAuth signing and Discogs API calls.
- [`auth.service.ts`](../../src/services/auth.service.ts) — client-side cookie reads and auth URL param parsing.

Details: [discogs.md](discogs.md).

### [`src/api/`](../../src/api/) and [`src/app/api/`](../../src/app/api/)

- [`src/api/helpers.ts`](../../src/api/helpers.ts) — client-side `fetch` wrappers for `/api/...` route handlers.
- Route handlers under `src/app/api/` implement authenticated Discogs proxying and crate persistence.

### [`src/hooks/`](../../src/hooks/)

Custom hooks and React Query hooks under [`hooks/queries/`](../../src/hooks/queries/). Notable feature hooks: [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts), [`useCollectionAnalytics`](../../src/hooks/useCollectionAnalytics.hook.ts), [`useCollectionReset`](../../src/hooks/useCollectionReset.hook.ts), [`useMosaicGenerator`](../../src/hooks/useMosaicGenerator.hook.ts).

### [`src/lib/`](../../src/lib/)

Server utilities: [`discogs-username.ts`](../../src/lib/discogs-username.ts), [`api-helpers.ts`](../../src/lib/api-helpers.ts) (verified OAuth + rate limit), [`private-route-response.ts`](../../src/lib/private-route-response.ts), [`public-crate.server.ts`](../../src/lib/public-crate.server.ts), [`public-stats.server.ts`](../../src/lib/public-stats.server.ts), rate limiting, admin helpers, Prisma client ([`db.ts`](../../src/lib/db.ts)). Network proxy: [`src/proxy.ts`](../../src/proxy.ts) (see [platform.md](platform.md)).

### [`src/utils/`](../../src/utils/)

Pure helpers: filtering, sorting, format/year/style availability, sync helpers, [`imageLoader.ts`](../../src/utils/imageLoader.ts) (mosaic + image proxy).

### [`src/tests/`](../../src/tests/)

Factories (`src/tests/factories/`), test providers, shared mocks.

## Data flow (high level)

### Authenticated collection browsing

1. User completes **Discogs OAuth**; access tokens and username land in **httpOnly / client-readable cookies** (see [discogs.md](discogs.md)).
2. **`AuthProvider`** checks `/api/auth/check` and reads `discogs_username` from cookies.
3. **`useDiscogsCollectionQuery`** (React Query) calls **`fetchDiscogsCollection`** in [`src/api/helpers.ts`](../../src/api/helpers.ts).
4. **`GET /api/collection`** validates the username, confirms cookie auth matches (case-insensitive), and calls **`discogsOAuthService.getCollection`** with signed OAuth headers.
5. **`useCollectionData`** flattens pages and dispatches **`FiltersActionTypes.SetAllReleases`** after each page so the grid fills incrementally; **`collectionFiltersActiveAtom`** gates persisted filter prefs until the last page. Pagination metadata goes to **`CollectionContext`**. **Filter atoms** derive filtered/sorted lists for the releases table, cards, mosaic, dashboard, and random release.

### Crates

1. Client mutations call **`/api/crates`** route handlers.
2. Handlers use **Prisma** to read/write `Crate` and `CrateRelease` rows scoped by **verified OAuth user ID** from **`getVerifiedUserFromRequestWithRateLimit`**—never the `discogs_user_id` cookie alone ([database.md](database.md)).
3. Public crates expose read-only data at **`/crate/[id]`** via [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) (page metadata via [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)).

## Config and quality gates

- **[`next.config.ts`](../../next.config.ts)** — env exposure, Discogs image hosts, CSP/security headers, SVGR, `transpilePackages` for Jest/Faker.
- **[`biome.json`](../../biome.json)** — lint and format rules.
- **[`knip.json`](../../knip.json)** — unused export detection.
- **[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)** — PR checks into `staging`: `tsc:ci` (includes `db:generate`), `lint:ci`, `lint:css`, `test:ci`, **`knip:ci`**.

Branching and releases are described in the root [README.md](../../README.md).
