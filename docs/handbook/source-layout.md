# Source layout

Quick map of **`src/`** and related top-level folders.

| Path | Role |
|------|------|
| [`src/app/`](../../src/app/) | App Router layouts, pages, route handlers (`app/api/...`). |
| [`src/components/`](../../src/components/) | Feature UI (Dashboard, ReleaseCard, StickyHeaderBar, …). |
| [`src/atoms/`](../../src/atoms/) | Jotai atoms: filters, view mode, shared `JotaiProvider`. |
| [`src/context/`](../../src/context/) | Auth, collection, crate, theme providers; filters/view scope markers (state in Jotai). |
| [`src/constants/`](../../src/constants/) | Topic constants (`sorting.ts`, `mosaic.ts`) alongside root [`constants.ts`](../../src/constants.ts). |
| [`src/services/`](../../src/services/) | Discogs OAuth service, client auth/cookie helpers. |
| [`src/api/`](../../src/api/) | Browser-side fetch helpers for `/api/...` routes. |
| [`src/hooks/`](../../src/hooks/) | Custom hooks; React Query under `hooks/queries/`. |
| [`src/lib/`](../../src/lib/) | Server utilities: Prisma client, username validation, public crate loader, private session response helpers, rate limit, admin helpers. |
| [`src/proxy.ts`](../../src/proxy.ts) | Next.js 16 proxy: private cache headers on auth and authenticated crate API routes. |
| [`src/utils/`](../../src/utils/) | Pure helpers: filter, sort, format tags, sync collection, image loader, `definedProps` (optional prop spreads). |
| [`src/types/`](../../src/types/) | Shared TypeScript types (Discogs shapes, crate, dashboard, public stats). |
| [`src/styles/`](../../src/styles/) | Global CSS, theme tokens ([`themes/base.css`](../../src/styles/themes/base.css), [`colors.css`](../../src/styles/themes/colors.css), [`theming.css`](../../src/styles/theming.css)), shared modules ([`typography.module.css`](../../src/styles/typography.module.css), [`accessibility.module.css`](../../src/styles/accessibility.module.css), nav/segmented controls), Stylelint custom properties. |
| [`src/tests/`](../../src/tests/) | Factories ([`factories/`](../../src/tests/factories/)), test providers, base page object, mocks ([`setupDefaultCrateApiMocks.ts`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts), [`mockApiResponse.ts`](../../src/tests/mocks/mockApiResponse.ts)). |
| [`public/images/`](../../public/images/) | Static marketing/login preview images. |
| [`prisma/`](../../prisma/) | Schema and migrations; datasource in [`prisma.config.ts`](../../prisma.config.ts). |
| [`scripts/`](../../scripts/) | Scaffold, env loading, DB pull helpers. |
| [`.jest/`](../../.jest/) | Jest setup, env vars, SVG mock. |
| [`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx) | Custom Testing Library render helpers (`test-utils` import alias). |

## Common lookups

| I need to… | Start here |
|------------|------------|
| Add a Discogs-proxied API route | Copy [`src/app/api/collection/route.ts`](../../src/app/api/collection/route.ts); use [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) |
| Validate a username param | [`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts) |
| Add a client fetch wrapper | [`src/api/helpers.ts`](../../src/api/helpers.ts) |
| Collection notes (read/write/UI) | [`src/utils/releaseNotes.ts`](../../src/utils/releaseNotes.ts), [`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/), [`src/app/api/collection/fields/`](../../src/app/api/collection/fields/), [`src/app/api/collection/instances/[instanceId]/fields/[fieldId]/`](../../src/app/api/collection/instances/[instanceId]/fields/[fieldId]/) |
| Collection analytics / dashboard | [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx), [`useCollectionAnalytics`](../../src/hooks/useCollectionAnalytics.hook.ts), [`dashboard.types.ts`](../../src/types/dashboard.types.ts) |
| Mosaic / cover grid export | [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx), [`useMosaicGenerator`](../../src/hooks/useMosaicGenerator.hook.ts), [`/api/image-proxy`](../../src/app/api/image-proxy/route.ts) |
| Clear user data (About/Legal) | [`clearData`](../../src/api/helpers.ts), [`POST /api/auth/clear-data`](../../src/app/api/auth/clear-data/route.ts), [`useCollectionReset`](../../src/hooks/useCollectionReset.hook.ts) |
| Add global UI state | Jotai atoms in [`src/atoms/`](../../src/atoms/) for derived client state; context in [`src/context/`](../../src/context/) for auth/session/server-backed flows; register providers in [`Providers.tsx`](../../src/components/Providers.tsx). Feature-scoped providers (e.g. release notes) live next to the component folder. |
| Add a React Query hook | [`src/hooks/queries/`](../../src/hooks/queries/) |
| Change filter logic | [`src/utils/filterReleases.ts`](../../src/utils/filterReleases.ts) + [`src/atoms/filters.atoms.ts`](../../src/atoms/filters.atoms.ts) |
| Crate DB changes | [`prisma/schema.prisma`](../../prisma/schema.prisma) + [`src/app/api/crates/`](../../src/app/api/crates/) |
| Crate drawer open/closed state | [`useCrateDrawer.hook.ts`](../../src/hooks/useCrateDrawer.hook.ts) + [`crate.context.tsx`](../../src/context/crate.context.tsx); layout in [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) |
| Auth cookies / login | [`src/app/api/auth/`](../../src/app/api/auth/) + [`auth.service.ts`](../../src/services/auth.service.ts) |
| Private session API cache headers | [`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts), [`src/proxy.ts`](../../src/proxy.ts) — see [platform.md](platform.md) |
| Public landing / about / legal shell | [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) + server [`PageFooter`](../../src/components/Page/PageFooter.server.tsx); home content in [`Login/`](../../src/components/Login/) |
| Unused code / dead exports | [`knip.json`](../../knip.json), `pnpm knip` |

**Tests** for a module usually sit **next to** that module (`*.spec.tsx` for PO-backed components, `*.test.ts(x)` for context/hooks/utils, optional **`*.po.tsx`** for page objects). Shared test infra lives under **`src/tests/`** (`BasePageObject.po.ts`, factories, mocks).
