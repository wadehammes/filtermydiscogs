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
- **UI libraries**: **Base UI** (`@base-ui/react`) for headless dialogs/popovers/toasts (styled via **`AppDialog`**, **`AppToaster`**, and CSS Modules), **TanStack Table** (releases list), **TanStack Charts** (dashboard), **Sharp** (image proxy for mosaic).
- **Styling**: **CSS Modules** (`.module.css`) plus global styles and theme tokens under [`src/styles/`](../../src/styles/).
- **Tooling**: **pnpm**, **Biome**, **Stylelint**, **Jest** + Testing Library, **Knip** (unused-code detection in CI).

