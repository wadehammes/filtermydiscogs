# Architecture

Map of FilterMyDisco.gs: technologies, top-level folders, and how Discogs collection data and Postgres crates reach the browser.

## Tech stack

- **Framework**: **Next.js 16** with the **App Router**. Routes and layouts live under [`src/app/`](../../src/app/).
- **UI**: React 19, TypeScript.
- **Auth & data source**: **Discogs OAuth 1.0a** and the Discogs REST API via [`src/services/discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts).
- **Persistence**: **Prisma** + **Vercel Postgres** for user crates and saved releases ([`prisma/schema.prisma`](../../prisma/schema.prisma)).
- **Client state**: **React Context + useReducer** for auth, collection, filters, crates, theme, and view mode; **TanStack React Query** for server-backed data (collection pages, crate mutations, dashboard stats).
- **Styling**: **CSS Modules** (`.module.css`) plus global styles and theme tokens under [`src/styles/`](../../src/styles/).
- **Tooling**: **pnpm** (see [`package.json`](../../package.json) `packageManager`), **Biome** for lint/format, **Stylelint** for CSS, **Jest** + Testing Library for tests.

## Directory map

### [`src/app/`](../../src/app/)

Next.js routes, layouts, and **Route Handlers** under `app/api/`.

- **Pages**: [`page.tsx`](../../src/app/page.tsx) (login/home), [`releases/`](../../src/app/releases/), [`mosaic/`](../../src/app/mosaic/), [`crate/[id]/`](../../src/app/crate/[id]/), [`about/`](../../src/app/about/), [`legal/`](../../src/app/legal/), [`admin/`](../../src/app/admin/).
- **API**: Discogs proxy routes (`collection`, `search`, `release`), auth routes (`auth/discogs`, `auth/callback`, `auth/logout`), crate CRUD under `crates/`, admin stats, OG image generation.
- **Root layout**: [`layout.tsx`](../../src/app/layout.tsx) — fonts, metadata defaults, `Providers`, Google Tag Manager.

Most feature pages are **client components** (`*Client.tsx`) wrapped by thin server `page.tsx` shells that set metadata.

### [`src/components/`](../../src/components/)

Feature UI: one folder per area (e.g. `Dashboard`, `ReleaseCard`, `StickyHeaderBar`, `PublicAuthLayout`). See [components.md](components.md).

**Public auth shell**: [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) wraps home, about, legal, and public crate pages — neutral [`var(--background)`](../../src/styles/themes/) page, optional server [`PageFooter`](../../src/components/Page/PageFooter.server.tsx), and [`PublicAuthHeader`](../../src/components/PublicAuthLayout/PublicAuthHeader.component.tsx) (logged-out [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) or authenticated [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) on about/legal). Logged-out [`Login`](../../src/components/Login/Login.component.tsx) is an Umbra-style landing: text-first hero, theme-aware [`LoginPreviewDemo`](../../src/components/Login/LoginPreviewDemo.component.tsx), feature rows, and a bottom connect CTA. Protected app routes gate on **`isCheckingAuth`** via standalone [`AuthLoading`](../../src/components/AuthLoading/AuthLoading.component.tsx), not `PublicAuthLayout`.

[`Providers.tsx`](../../src/components/Providers.tsx) wires QueryClient and all context providers.

### [`src/context/`](../../src/context/)

Global UI state via **useReducer** contexts: auth, collection, filters, crate, theme, view. See [patterns.md](patterns.md).

### [`src/services/`](../../src/services/)

- [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) — server-side OAuth signing and Discogs API calls.
- [`auth.service.ts`](../../src/services/auth.service.ts) — client-side cookie reads and auth URL param parsing.

Details: [discogs.md](discogs.md).

### [`src/api/`](../../src/api/) and [`src/app/api/`](../../src/app/api/)

- [`src/api/helpers.ts`](../../src/api/helpers.ts) — client-side `fetch` wrappers for `/api/...` route handlers (collection, crates, search, logout).
- Route handlers under `src/app/api/` implement authenticated Discogs proxying and crate persistence.

### [`src/hooks/`](../../src/hooks/)

Custom hooks and React Query hooks under [`hooks/queries/`](../../src/hooks/queries/) and [`hooks/queries/useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts).

### [`src/lib/`](../../src/lib/)

Server utilities: [`discogs-username.ts`](../../src/lib/discogs-username.ts), [`api-helpers.ts`](../../src/lib/api-helpers.ts), [`public-crate.server.ts`](../../src/lib/public-crate.server.ts), rate limiting, admin helpers, Prisma client ([`db.ts`](../../src/lib/db.ts)).

### [`src/utils/`](../../src/utils/)

Pure helpers: filtering, sorting, format/year/style availability, sync helpers.

### [`src/tests/`](../../src/tests/)

Factories (`src/tests/factories/`), test providers, shared mocks.

## Data flow (high level)

### Authenticated collection browsing

1. User completes **Discogs OAuth**; access tokens and username land in **httpOnly / client-readable cookies** (see [discogs.md](discogs.md)).
2. **`AuthProvider`** checks `/api/auth/check` and reads `discogs_username` from cookies.
3. **`useDiscogsCollectionQuery`** (React Query) calls **`fetchDiscogsCollection`** in [`src/api/helpers.ts`](../../src/api/helpers.ts).
4. **`GET /api/collection`** validates the username, confirms cookie auth matches (case-insensitive), and calls **`discogsOAuthService.getCollection`** with signed OAuth headers.
5. Releases flow into **`CollectionContext`** and **`FiltersContext`**, which derive filtered/sorted lists for the releases table, cards, and dashboard charts.

### Crates

1. Client mutations call **`/api/crates`** route handlers.
2. Handlers use **Prisma** to read/write `Crate` and `CrateRelease` rows scoped by `user_id` from the `discogs_user_id` cookie.
3. Public crates expose read-only data at **`/crate/[id]`** via [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts).

## Config and quality gates

- **[`next.config.ts`](../../next.config.ts)** — env exposure, Discogs image hosts, CSP/security headers, SVGR, `transpilePackages` for Jest/Faker.
- **[`biome.json`](../../biome.json)** — lint and format rules.
- **[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)** — PR checks into `staging`: Prisma generate, `tsc:ci`, `lint:ci`, `lint:css`, `test:ci`.

Branching and releases are described in the root [README.md](../../README.md).
