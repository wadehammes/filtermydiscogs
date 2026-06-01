# Source layout

Quick map of **`src/`** and related top-level folders.

| Path | Role |
|------|------|
| [`src/app/`](../../src/app/) | App Router layouts, pages, route handlers (`app/api/...`). |
| [`src/components/`](../../src/components/) | Feature UI (Dashboard, ReleaseCard, StickyHeaderBar, …). |
| [`src/context/`](../../src/context/) | Global state: auth, collection, filters, crate, theme, view. |
| [`src/services/`](../../src/services/) | Discogs OAuth service, client auth/cookie helpers. |
| [`src/api/`](../../src/api/) | Browser-side fetch helpers for `/api/...` routes. |
| [`src/hooks/`](../../src/hooks/) | Custom hooks; React Query under `hooks/queries/`. |
| [`src/lib/`](../../src/lib/) | Server utilities: Prisma client, username validation, public crate loader, rate limit, admin helpers. |
| [`src/utils/`](../../src/utils/) | Pure helpers: filter, sort, format tags, sync collection. |
| [`src/types/`](../../src/types/) | Shared TypeScript types (Discogs shapes, crate, dashboard). |
| [`src/styles/`](../../src/styles/) | Global CSS, theme tokens, Stylelint custom properties. |
| [`src/constants.ts`](../../src/constants.ts) | App-wide constants (storage keys, sort enums). |
| [`src/tests/`](../../src/tests/) | Factories ([`factories/`](../../src/tests/factories/)), test providers, base page object, mocks. |
| [`prisma/`](../../prisma/) | Schema and migrations. |
| [`scripts/`](../../scripts/) | Scaffold, env loading, DB pull helpers. |
| [`.jest/`](../../.jest/) | Jest setup, env vars, SVG mock. |
| [`test-utils.tsx`](../../test-utils.tsx) | Custom Testing Library render helpers. |

## Common lookups

| I need to… | Start here |
|------------|------------|
| Add a Discogs-proxied API route | Copy [`src/app/api/collection/route.ts`](../../src/app/api/collection/route.ts); use [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) |
| Validate a username param | [`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts) |
| Add a client fetch wrapper | [`src/api/helpers.ts`](../../src/api/helpers.ts) |
| Add global UI state | New reducer context in [`src/context/`](../../src/context/); register in [`Providers.tsx`](../../src/components/Providers.tsx) |
| Add a React Query hook | [`src/hooks/queries/`](../../src/hooks/queries/) |
| Change filter logic | [`src/utils/filterReleases.ts`](../../src/utils/filterReleases.ts) + [`filters.context.tsx`](../../src/context/filters.context.tsx) |
| Crate DB changes | [`prisma/schema.prisma`](../../prisma/schema.prisma) + [`src/app/api/crates/`](../../src/app/api/crates/) |
| Auth cookies / login | [`src/app/api/auth/`](../../src/app/api/auth/) + [`auth.service.ts`](../../src/services/auth.service.ts) |

**Tests** for a module usually sit **next to** that module (`*.test.ts`, `*.test.tsx`, `*.component.test.tsx`, `*.spec.tsx`, optional **`*.po.tsx`** for page objects).
