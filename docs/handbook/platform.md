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
| `pnpm dev` | Next dev server on **port 6767** (Turbopack). |
| `pnpm dev:webpack` | Same as **`pnpm dev`** but **Webpack** — use when Turbopack dev hits “module factory is not available” on lazy chunks. |
| `pnpm build` | `db:generate` + production build (Turbopack; default in Next.js 16.3). Root [`global-error.tsx`](../../src/app/global-error.tsx) stays provider-free so `/_global-error` prerender succeeds. |
| `pnpm start` | Serve production build on port 6767. |
| `pnpm tsc:ci` | `db:generate` + strict TypeScript (`tsc --strict`). |
| `pnpm lint:ci` / `pnpm test:ci` / `pnpm knip:ci` | Quality gates. |
| `pnpm test:coverage` | Jest coverage report (`jest --coverage`). |
| `pnpm knip` | Find unused exports/files locally ([`knip.json`](../../knip.json)). |
| `pnpm lint:css` | Stylelint over `src/**/*.css`. |
| `pnpm scaffold` | New component scaffold script. |
| `pnpm db:*` | Prisma generate, migrate, push, studio (see [database.md](database.md)). |
| `pnpm analyze` / `pnpm lighthouse` | Bundle and performance tooling. |
| `pnpm test:e2e` / `pnpm test:e2e:install` | Playwright instant-navigation regression tests ([`e2e/`](../../e2e/)); run **`test:e2e:install`** once for Chromium. |

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
| `IP_RATE_LIMIT_MAX` / `IP_RATE_LIMIT_WINDOW` | Default per-IP API rate limit (120 requests / 60s) |
| `IMAGE_PROXY_RATE_LIMIT_MAX` / `IMAGE_PROXY_RATE_LIMIT_WINDOW` | Higher limit for [`/api/image-proxy`](../../src/app/api/image-proxy/route.ts) (default **2500** / 60s) so mosaic export can load one tile per release |

[`next.config.ts`](../../next.config.ts) **`env`** block exposes only **`DISCOGS_CONSUMER_KEY`** and **`DISCOGS_CALLBACK_URL`** to the Next bundle. **`DISCOGS_CONSUMER_SECRET`** stays a runtime server env var (used by [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) only). Do not add server-only secrets to **`env`**.

Local values: **`.env.local`** (gitignored). See root [README.md](../../README.md) for setup steps.

## `next.config.ts` highlights

- **Images**: remote patterns for **`i.discogs.com`** and placeholders.
- **`serverExternalPackages: ["sharp"]`**: keeps the image-proxy native module out of the bundler so Vercel can include **`@img/sharp-linux-*`** binaries.
- **Security headers**: CSP (tighter in production), HSTS, frame options, etc. on `/`, `/api/*`, and static paths. Production CSP restricts **`connect-src`**, **`frame-src`**, and **`img-src`**; development keeps broader directives for local debugging. Playback embeds use **`youtube-nocookie.com`** — both **`*.youtube.com`** and **`*.youtube-nocookie.com`** must stay in **`frame-src`** / **`child-src`**. Vercel preview **`script-src`** also allows **`vercel.live`** for the Live feedback widget.
- **`productionBrowserSourceMaps`**: `false` (do not ship client source maps).
- **`transpilePackages`**: **`@faker-js/faker`** (ESM-only), **`@tanstack/react-table`** / **`@tanstack/table-core`**, and **`@tanstack/charts`** / **`@tanstack/charts-scales`** / **`@tanstack/react-charts`** (ESM dashboard charts), plus **`d3-shape`** for pie layouts — required so Next/Jest can transpile them.
- **PostCSS**: [`postcss.config.cjs`](../../postcss.config.cjs) (not `.js`) — Turbopack 16.3 treats `postcss.config.js` as an async module and can fail with `__turbopack_context__.a is not a function` on large CSS builds; `.cjs` avoids the broken loader path.
- **SVGR**: [`turbopack.rules`](../../next.config.ts) for SVG-as-React components in dev/build (no separate **`webpack()`** hook — Turbopack is the default). Type declarations for `*.svg` imports live in root [`cssprops.d.ts`](../../cssprops.d.ts) (included by [`tsconfig.json`](../../tsconfig.json)).
- **`experimental.optimizePackageImports`**: tree-shaking for TanStack (**`@tanstack/react-charts`** on dashboard), **`@dnd-kit/*`**, and **`sonner`**.
- **Cache Components** (`cacheComponents: true`): enables Partial Prerendering (PPR) and the `"use cache"` directive. Required for Instant Navigations prefetching.
- **Partial Prefetching** (`partialPrefetching: true`): prefetches only the static shell for linked routes so navigations can feel instant before dynamic data resolves.
- **TypeScript**: **`typescript@^7`** with Next.js 16.3+ (native TS 7 support in `next build`).
- **React Compiler** (`reactCompiler.compilationMode: "annotation"`): opt-in per component via **`"use memo"`**. The experimental Rust Turbopack port is **off** for now — it triggered dev Instant Insights validation bugs (`moduleLoading` / work-store invariants on routes like **`/legal`**). Re-enable **`experimental.turbopackRustReactCompiler`** after a Next.js patch. Annotated components: [`ReleaseCardGrid`](../../src/components/ReleaseCardGrid/ReleaseCardGrid.component.tsx), [`CrateLayoutList`](../../src/components/Crates/CrateLayoutList.component.tsx), [`ReleaseMiniPlayer`](../../src/components/ReleasePlayback/ReleaseMiniPlayer.component.tsx).
- **Bundle analysis**: **`pnpm analyze`** / **`@next/bundle-analyzer`** still require **`next build --webpack`** — Turbopack production builds do not emit webpack stats yet.

If you add a new third-party script domain, update **CSP** in the same change.

## Cache Components and Instant Navigations

Next.js 16.3 **Cache Components** (PPR + `"use cache"`) are enabled in [`next.config.ts`](../../next.config.ts).

### Turbopack and Sharp

Dev and production use **Turbopack** (no **`--webpack`** in [`package.json`](../../package.json)). Keep **`serverExternalPackages: ["sharp"]`** so [`/api/image-proxy`](../../src/app/api/image-proxy/route.ts) and **`next/image`** trace **`@img/sharp-*`** / **`@img/sharp-libvips-*`** native binaries on Vercel. Next.js 16.3+ fixed Turbopack file tracing for Sharp 0.35+. After deploy, smoke-test **`/api/image-proxy`** and mosaic export on the preview URL.

### Instant Navigations (app-wide)

The codemod **`@next/codemod cache-components-instant-false`** added **`export const instant = false`** during the Cache Components migration. Those opt-outs are **removed app-wide** (including root [`layout.tsx`](../../src/app/layout.tsx)). Routes show **◐ Partial Prerender** in **`next build`** output where applicable.

When adding routes or root-level client components, use **Next DevTools → Instant Insights** to confirm shells prefetch cleanly.

### PPR and blocking client hooks

Cache Components prerender static shells. Client hooks that depend on request-time data (**`usePathname`**, **`useSearchParams`**, **`useMediaQuery`**, etc.) must sit inside a **`<Suspense>`** boundary or the build fails with **`CLIENT_HOOK_DYNAMIC`**.

| Component | Pattern |
|-----------|---------|
| [`ThemeProvider`](../../src/context/theme.context.tsx) | **`ThemeProviderInner`** (uses **`useMediaQuery`** + **`usePathname`**) wrapped in **`<Suspense>`**; fallback exposes a static theme context while **`/theme-init.js`** keeps the correct **`data-theme`** on **`html`** |
| [`AuthCheckingToast`](../../src/components/AuthCheckingToast/AuthCheckingToast.component.tsx) | Inner component with **`usePathname`** wrapped in **`<Suspense fallback={null}>`** |
| Dynamic **`params`** on [`/crates/[id]`](../../src/app/crates/[id]/page.tsx) and [`/crate/[id]`](../../src/app/crate/[id]/page.tsx) | **`await params`** in an inner async server component wrapped in **`<Suspense>`** with **`AppPageLoading`** / **`PageLoader`** fallback — keeps the route shell instant |

Do not re-add **`export const instant = false`** on the root layout to paper over missing Suspense boundaries — fix the hook site instead.

Public legal copy lives in the server component [`LegalPageContent.server.tsx`](../../src/app/legal/LegalPageContent.server.tsx); auth-only **Clear All Data** UI is in [`LegalDataManagementActions.client.tsx`](../../src/app/legal/LegalDataManagementActions.client.tsx) inside **`<Suspense>`** so the instant shell can prerender the policy text.

### Cached helpers (prerender-safe)

| Location | Pattern |
|----------|---------|
| [`PageFooter.server.tsx`](../../src/components/Page/PageFooter.server.tsx) | `getCopyrightYear()` with `"use cache"` + `cacheLife("max")` — avoids `new Date()` breaking static prerender |
| [`sitemap.ts`](../../src/app/sitemap.ts) | `buildSitemap()` with `"use cache"` + `cacheLife("days")` |
| [`/api/og/crate/[id]`](../../src/app/api/og/crate/[id]/route.tsx) | Cached OG image helper with `"use cache"` + `cacheLife({ revalidate: 300 })` |

Do not call **`new Date()`** (or other non-deterministic APIs) directly in components that must prerender as static — wrap in a `"use cache"` helper or move to a dynamic boundary.

### Test mocks

[`createMockAppRouter`](../../src/tests/mocks/mockAppRouter.mock.ts) includes **`bfcacheId: ""`** — required by Next.js 16.3 **`AppRouterInstance`** typing in Jest.

### Playwright instant navigation tests

[`e2e/instant-navigation.spec.ts`](../../e2e/instant-navigation.spec.ts) uses **`instant()`** from **`@next/playwright`** to assert public-route shells appear during navigation without waiting for dynamic data. Config: [`playwright.config.ts`](../../playwright.config.ts) (starts **`pnpm dev`** on port **6767**). The testing API is available in development by default; production **`next start`** e2e requires **`experimental.exposeTestingApiInProductionBuild`** (preview/CI only — never enable on live production).

Add similar tests when authenticated instant routes stabilize (header nav to **`/releases`**, **`/dashboard`**, etc.).

## Private session API responses

Cookie-authenticated **`/api/auth/*`** and authenticated **`/api/crates/*`** routes (not **`/api/crates/public`**) must not be cached at the CDN or edge.

| Mechanism | Location | Role |
|-----------|----------|------|
| Route handlers | [`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts) | Return JSON via **`privateRouteJson`**, redirects via **`privateRouteRedirect`** (`Cache-Control: private, no-store`, **`Vary: Cookie`**) |
| Error bodies | [`createErrorResponse`](../../src/lib/api-helpers.ts) in [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts) | Sanitized errors wrapped in **`privateRouteJson`** |
| Dynamic rendering | Cookie / `searchParams` access in handlers | With **`cacheComponents`**, routes that read **`request.cookies`** or **`nextUrl.searchParams`** bail out of prerender automatically — do **not** add **`export const dynamic = "force-dynamic"`** (incompatible with Cache Components) |
| Edge pass-through | [`src/proxy.ts`](../../src/proxy.ts) | Next.js 16 network proxy; applies private cache headers on auth and authenticated crate API routes when a handler omits them |

Do **not** use bare **`NextResponse.json`** on private session routes—use **`privateRouteJson`** (or **`createErrorResponse`** in `catch` blocks). Public crate reads keep their own cache policy in [`/api/crates/public/[id]`](../../src/app/api/crates/public/[id]/route.ts).

Authenticated **collection** routes (`/api/collection`, `/api/collection/fields`, `/api/collection/value`) return success responses with **`Cache-Control: private, max-age=…`** plus **`Vary: Cookie`** (browser-private cache keyed by session). Auth failures still return **`privateRouteJson`** via **`requireAuthenticatedDiscogsUser`**. Client helpers for these routes send **`credentials: "include"`**.

## Jest

[`jest.config.ts`](../../jest.config.ts) uses **`next/jest`** with:

- **`test-utils`** alias → [`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)
- **`src/`** path alias
- SVG and CSS mocks under **`.jest/`**
- Custom **`transformIgnorePatterns`** for pnpm layout + **`@faker-js/faker`**, **`@tanstack/react-table`** / **`@tanstack/table-core`**, **`@tanstack/charts`** packages, and **`d3-shape`** (see comments in config)

Faker, TanStack Table, and TanStack Charts transpilation depends on **`transpilePackages`** in `next.config.ts` **and** excluding those packages from the custom ignore pattern.

## Analytics

Google Tag Manager (`GOOGLE_TAG_MANAGER_ID` in [`analytics.ts`](../../src/constants/analytics.ts), currently `GTM-NCP5CSG`) loads only after the visitor opts in to analytics cookies. Consent is hybrid:

| Storage | Role |
|---------|------|
| **`localStorage`** (`filtermydiscogs_analytics_consent`: `granted` \| `denied`; absent = pending) | Source of truth for whether GTM may load on this browser (logged-out visitors included) |
| **`User.preferences.analyticsConsent`** | Syncs choice across devices when signed in; seeded from local on first login |

- **`AnalyticsConsentProvider`** ([`analyticsConsent.context.tsx`](../../src/context/analyticsConsent.context.tsx)) + **`CookieConsentBanner`** show a bottom bar while consent is pending.
- **`GoogleTagManagerLoader`** ([`GoogleTagManagerLoader.component.tsx`](../../src/components/GoogleTagManagerLoader/GoogleTagManagerLoader.component.tsx)) imperatively injects the GTM script inside **`Providers`** once when consent is **`granted`** (never unmounts via React—avoids `removeChild` errors from conditional **`next/script`** cleanup). Root [`layout.tsx`](../../src/app/layout.tsx) does **not** load GTM unconditionally.
- **`trackEvent`** ([`analytics.ts`](../../src/analytics/analytics.ts)) no-ops unless local consent is **`granted`** ([`analyticsConsentStorage.ts`](../../src/utils/analyticsConsentStorage.ts)).
- Settings → **Data** toggle updates consent and persists when authenticated; revoking reloads the page so injected GTM scripts stop.
- **Clear all stored data** clears analytics consent (user is re-prompted). Normal logout does **not** reset consent.

Manual follow-up (out of repo): configure **Google Consent Mode v2** in the GTM container to default-deny until consent.

## Cursor hooks

Project agent hooks live in [`.cursor/hooks.json`](../../.cursor/hooks.json) and [`.cursor/hooks/`](../../.cursor/hooks/README.md). They enforce handbook conventions (CSS rules, scaffold/factory placement, no comments/barrels) and nudge handbook updates after edits. Requires `jq` and executable hook scripts.

## Releases

Tag releases with **`make release tag=vX.Y.Z`** (see root README). Release workflow: [`.github/workflows/release.yml`](../../.github/workflows/release.yml).
