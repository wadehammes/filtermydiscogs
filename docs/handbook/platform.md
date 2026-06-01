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

GitHub Actions are **pinned to commit SHAs** with version comments (see workflow file).

Run the same locally before pushing when possible.

## Package scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Next dev server on **port 6767** (webpack mode). |
| `pnpm build` | `db:generate` + production build. |
| `pnpm start` | Serve production build on port 6767. |
| `pnpm tsc:ci` / `pnpm lint:ci` / `pnpm test:ci` | Quality gates. |
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

[`next.config.ts`](../../next.config.ts) **`env`** block exposes Discogs consumer key/secret/callback to the Next bundle—treat as **intentionally client-visible** for OAuth initiation; do not add server-only secrets there.

Local values: **`.env.local`** (gitignored). See root [README.md](../../README.md) for setup steps.

## `next.config.ts` highlights

- **Images**: remote patterns for **`i.discogs.com`** and placeholders.
- **Security headers**: CSP, HSTS, frame options, etc. on `/`, `/api/*`, and static paths.
- **`transpilePackages: ["@faker-js/faker"]`**: required because Faker 10+ is ESM-only and Jest must transpile it.
- **SVGR**: webpack + turbopack rules for SVG-as-React components.
- **`experimental.optimizePackageImports`**: tree-shaking for TanStack packages.

If you add a new third-party script domain, update **CSP** in the same change.

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
