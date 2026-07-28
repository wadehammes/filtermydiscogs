# Platform, CI, and environment

CI, scripts, environment variables, security headers, and Jest/Next integration.

## Continuous integration

Pull requests targeting **`staging`** run [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):

1. Checkout (full history).
2. **pnpm** via **pnpm/action-setup**; **Node** version from [`.tool-versions`](../../.tool-versions).
3. **`pnpm install`**
4. **`pnpm tsc:ci`** (runs `db:generate` first)
5. **`pnpm lint:ci`**
6. **`pnpm lint:css`**
7. **`pnpm test:ci`**
8. **`pnpm knip:ci`**

GitHub Actions are **pinned to commit SHAs** with version comments (see workflow file).

Run the same locally before pushing when possible.

## Package scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Next dev server on **port 6767** (webpack mode). |
| `pnpm build` | `db:generate` + production build (**`--webpack`**; Turbopack’s hashed `sharp` externals omit linux native binaries on Vercel). Root [`global-error.tsx`](../../src/app/global-error.tsx) stays provider-free so `/_global-error` prerender succeeds under webpack. |
| `pnpm start` | Serve production build on port 6767. |
| `pnpm tsc:ci` | `db:generate` + strict TypeScript (`tsc --strict`). |
| `pnpm lint:ci` / `pnpm test:ci` / `pnpm knip:ci` | Quality gates. |
| `pnpm test:coverage` | Jest coverage report (`jest --coverage`). |
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
| `NEXT_PUBLIC_SITE_URL` | Public site URL for metadata/OG (optional; defaults to `https://www.filtermydisco.gs`). Vercel domain settings redirect apex → `www`. |
| `ADMIN_USER_ID` | Discogs user ID allowed to access `/admin` |

[`next.config.ts`](../../next.config.ts) **`env`** block exposes only **`DISCOGS_CONSUMER_KEY`** and **`DISCOGS_CALLBACK_URL`** to the Next bundle. **`DISCOGS_CONSUMER_SECRET`** stays a runtime server env var (used by [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) only). Do not add server-only secrets to **`env`**.

Local values: **`.env.local`** (gitignored). See root [README.md](../../README.md) for setup steps.

## `next.config.ts` highlights

- **Images**: remote patterns for **`i.discogs.com`** and placeholders.
- **`serverExternalPackages: ["sharp"]`**: keeps the image-proxy native module out of the bundler so Vercel can include **`@img/sharp-linux-*`** binaries.
- **Security headers**: CSP (tighter in production), HSTS, frame options, etc. on `/`, `/api/*`, and static paths. Production CSP restricts **`connect-src`**, **`frame-src`**, and **`img-src`**; development keeps broader directives for local debugging. Playback embeds use **`youtube-nocookie.com`** — both **`*.youtube.com`** and **`*.youtube-nocookie.com`** must stay in **`frame-src`** / **`child-src`**. Vercel preview **`script-src`** also allows **`vercel.live`** for the Live feedback widget.
- **`productionBrowserSourceMaps`**: `false` (do not ship client source maps).
- **`transpilePackages: ["@faker-js/faker"]`**: required because Faker 10+ is ESM-only and Jest must transpile it.
- **SVGR**: webpack + turbopack rules for SVG-as-React components. Type declarations for `*.svg` imports live in root [`cssprops.d.ts`](../../cssprops.d.ts) (included by [`tsconfig.json`](../../tsconfig.json)).
- **`experimental.optimizePackageImports`**: tree-shaking for TanStack packages.
- **TypeScript**: pin **`typescript@^6`** until Next.js 16.2 stable supports TypeScript 7 (Next 16.3+ adds `experimental.useTypeScriptCli`). TypeScript 7 removes `lib/typescript.js`, which `next build` still probes for during type checking.

If you add a new third-party script domain, update **CSP** in the same change.

## Private session API responses

Cookie-authenticated **`/api/auth/*`** and authenticated **`/api/crates/*`** routes (not **`/api/crates/public`**) must not be cached at the CDN or edge.

| Mechanism | Location | Role |
|-----------|----------|------|
| Route handlers | [`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts) | Return JSON via **`privateRouteJson`**, redirects via **`privateRouteRedirect`** (`Cache-Control: private, no-store`, **`Vary: Cookie`**) |
| Error bodies | [`createErrorResponse`](../../src/lib/api-helpers.ts) in [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts) | Sanitized errors wrapped in **`privateRouteJson`** |
| Dynamic rendering | `export const dynamic = "force-dynamic"` on each auth/crate handler | Prevents Next.js from caching handler output |
| Edge pass-through | [`src/proxy.ts`](../../src/proxy.ts) | Next.js 16 network proxy; applies private cache headers on auth and authenticated crate API routes when a handler omits them |

Do **not** use bare **`NextResponse.json`** on private session routes—use **`privateRouteJson`** (or **`createErrorResponse`** in `catch` blocks). Public crate reads keep their own cache policy in [`/api/crates/public/[id]`](../../src/app/api/crates/public/[id]/route.ts).

Authenticated **collection** routes (`/api/collection`, `/api/collection/fields`, `/api/collection/value`) use **`export const dynamic = "force-dynamic"`** and success responses with **`Cache-Control: private, max-age=…`** plus **`Vary: Cookie`** (browser-private cache keyed by session). Auth failures still return **`privateRouteJson`** via **`requireAuthenticatedDiscogsUser`**. Client helpers for these routes send **`credentials: "include"`**.

## Jest

[`jest.config.ts`](../../jest.config.ts) uses **`next/jest`** with:

- **`test-utils`** alias → [`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)
- **`src/`** path alias
- SVG and CSS mocks under **`.jest/`**
- Custom **`transformIgnorePatterns`** for pnpm layout + **`@faker-js/faker`** (see comments in config)

Faker transpilation depends on **`transpilePackages`** in `next.config.ts` **and** excluding faker from the custom ignore pattern.

## Analytics

[`src/app/layout.tsx`](../../src/app/layout.tsx) mounts **Google Tag Manager** (`GTM-NCP5CSG`) via **`@next/third-parties/google`**.

## Cursor hooks

Project agent hooks live in [`.cursor/hooks.json`](../../.cursor/hooks.json) and [`.cursor/hooks/`](../../.cursor/hooks/README.md). They enforce handbook conventions (CSS rules, scaffold/factory placement, no comments/barrels) and nudge handbook updates after edits. Requires `jq` and executable hook scripts.

## Releases

Tag releases with **`make release tag=vX.Y.Z`** (see root README). Release workflow: [`.github/workflows/release.yml`](../../.github/workflows/release.yml).
