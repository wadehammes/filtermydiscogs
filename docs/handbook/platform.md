# Platform, CI, and environment

CI, scripts, environment variables, security headers, and Jest/Next integration.

## Continuous integration

Pull requests targeting **`staging`** run [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):

1. Checkout (full history).
2. **pnpm** via **pnpm/action-setup**; **Node** version from [`.tool-versions`](../../.tool-versions).
3. **`pnpm install`**
4. **`pnpm prisma generate`**
5. **`pnpm tsc:ci`**
6. **`pnpm lint:ci`**
7. **`pnpm lint:css`**
8. **`pnpm test:ci`**
9. **`pnpm knip:ci`**

GitHub Actions are **pinned to commit SHAs** with version comments (see workflow file).

Run the same locally before pushing when possible.

## Package scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Next dev server on **port 6767** (webpack mode). |
| `pnpm build` | `db:generate` + production build. |
| `pnpm start` | Serve production build on port 6767. |
| `pnpm tsc:ci` / `pnpm lint:ci` / `pnpm test:ci` / `pnpm knip:ci` | Quality gates. |
| `pnpm knip` | Find unused exports/files locally ([`knip.json`](../../knip.json)). |
| `pnpm lint:css` | Stylelint over `src/**/*.css`. |
| `pnpm scaffold` | New component scaffold script. |
| `pnpm db:*` | Prisma generate, migrate, push, studio (see [database.md](database.md)). |
| `pnpm analyze` / `pnpm lighthouse` | Bundle and performance tooling. |

Full list: [`package.json`](../../package.json).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DISCOGS_CONSUMER_KEY` / `DISCOGS_CONSUMER_SECRET` | OAuth app credentials |
| `DISCOGS_CALLBACK_URL` | OAuth redirect (optional; has dev default) |
| `DISCOGS_API_USER_AGENT` | Optional Discogs API User-Agent override |
| `DATABASE_URL` | Postgres connection string for Prisma |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for metadata/OG (optional) |
| `ADMIN_USER_ID` | Discogs user ID allowed to access `/admin` |

[`next.config.ts`](../../next.config.ts) **`env`** block exposes only **`DISCOGS_CONSUMER_KEY`** and **`DISCOGS_CALLBACK_URL`** to the Next bundle. **`DISCOGS_CONSUMER_SECRET`** stays a runtime server env var (used by [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) only). Do not add server-only secrets to **`env`**.

Local values: **`.env.local`** (gitignored). See root [README.md](../../README.md) for setup steps.

## `next.config.ts` highlights

- **Images**: remote patterns for **`i.discogs.com`** and placeholders.
- **Security headers**: CSP (tighter in production), HSTS, frame options, etc. on `/`, `/api/*`, and static paths. Production CSP restricts **`connect-src`**, **`frame-src`**, and **`img-src`**; development keeps broader directives for local debugging.
- **`productionBrowserSourceMaps`**: `false` (do not ship client source maps).
- **`transpilePackages: ["@faker-js/faker"]`**: required because Faker 10+ is ESM-only and Jest must transpile it.
- **SVGR**: webpack + turbopack rules for SVG-as-React components.
- **`experimental.optimizePackageImports`**: tree-shaking for TanStack packages.

If you add a new third-party script domain, update **CSP** in the same change.

## Private session API responses

Cookie-authenticated **`/api/auth/*`** and authenticated **`/api/crates/*`** routes (not **`/api/crates/public`**) must not be cached at the CDN or edge.

| Mechanism | Location | Role |
|-----------|----------|------|
| Route handlers | [`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts) | Return JSON via **`privateRouteJson`**, redirects via **`privateRouteRedirect`** (`Cache-Control: private, no-store`, **`Vary: Cookie`**) |
| Error bodies | [`createErrorResponse`](../../src/lib/api-helpers.ts) in [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts) | Sanitized errors wrapped in **`privateRouteJson`** |
| Dynamic rendering | `export const dynamic = "force-dynamic"` on each auth/crate handler | Prevents Next.js from caching handler output |
| Edge pass-through | [`src/proxy.ts`](../../src/proxy.ts) | Next.js 16 network proxy (replaces deprecated **`middleware.ts`**); applies the same cache headers when a handler omits them |

Do **not** use bare **`NextResponse.json`** on private session routes—use **`privateRouteJson`** (or **`createErrorResponse`** in `catch` blocks). Public crate reads keep their own cache policy in [`/api/crates/public/[id]`](../../src/app/api/crates/public/[id]/route.ts).

## Jest

[`jest.config.ts`](../../jest.config.ts) uses **`next/jest`** with:

- **`test-utils`** alias → [`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)
- **`src/`** path alias
- SVG and CSS mocks under **`.jest/`**
- Custom **`transformIgnorePatterns`** for pnpm layout + **`@faker-js/faker`** (see comments in config)

Faker transpilation depends on **`transpilePackages`** in `next.config.ts` **and** excluding faker from the custom ignore pattern.

## Analytics

[`src/app/layout.tsx`](../../src/app/layout.tsx) mounts **Google Tag Manager** (`GTM-NCP5CSG`) via **`@next/third-parties/google`**.

## Releases

Tag releases with **`make release tag=vX.Y.Z`** (see root README). Release workflow: [`.github/workflows/release.yml`](../../.github/workflows/release.yml).
