| Authenticated clients ([`ReleasesClient`](../../src/components/ReleasesClient/ReleasesClient.component.tsx), [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx), [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx)) | While **`isCheckingAuth`**, render **`AppPageLoading`** (or dashboard skeleton) — not **`null`** — so Instant Navigations can validate the route shell; only **`shouldRedirectHome`** returns **`null`** before redirect                                                                                 |
| Dynamic **`params`** on [`/crates/[id]`](../../src/app/crates/[id]/page.tsx)                                                                                                                                                                                                    | **`await params`** in an inner async server component wrapped in **`<Suspense>`** with **`AppPageLoading`** fallback — keeps the route shell instant                                                                                                                                                     |
| [`/crate/[id]`](../../src/app/crate/[id]/page.tsx) (public share)                                                                                                                                                                                                               | **`await params`** on the page and render **[`PublicCrateClient`](../../src/components/PublicCrate/PublicCrateClient.component.tsx)** directly — no route **`Suspense`** (client **`main`** + MSW/e2e must not sit behind **`PageLoader`** while RSC streams); loading/error stay inside the client tree |

Do not re-add **`export const instant = false`** on the root layout to paper over missing Suspense boundaries — fix the hook site instead. When pathname is only needed on user interaction, prefer **`window.location.pathname`** in the handler (see **`SupportProjectToast`** / **`SupportProjectNavLink`**) over **`usePathname`** at render.

Public legal copy lives in the server component [`LegalPageContent.server.tsx`](../../src/components/Legal/LegalPageContent.server.tsx) (Terms, Privacy—including optional donations, Sentry error monitoring, and Session Replay—and data-management lists); auth-only **Clear All Data** UI is in [`LegalDataManagementActions.client.tsx`](../../src/components/Legal/LegalDataManagementActions.client.tsx) inside **`<Suspense>`** so the instant shell can prerender the policy text.

### Cached helpers (prerender-safe)

| Location                                                                   | Pattern                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`PageFooter.server.tsx`](../../src/components/Page/PageFooter.server.tsx) | `getCopyrightYear()` with `"use cache"` + `cacheLife("max")` — avoids `new Date()` breaking static prerender |
| [`sitemap.ts`](../../src/app/sitemap.ts)                                   | `buildSitemap()` with `"use cache"` + `cacheLife("days")`                                                    |
| [`/api/og/crate/[id]`](../../src/app/api/og/crate/[id]/route.tsx)          | Cached OG image helper with `"use cache"` + `cacheLife({ revalidate: 300 })`                                 |

Do not call **`new Date()`** (or other non-deterministic APIs) directly in components that must prerender as static — wrap in a `"use cache"` helper or move to a dynamic boundary.

**`/admin`** server gate ([`AdminDashboardGate.server.tsx`](../../src/components/AdminDashboard/AdminDashboardGate.server.tsx)) calls Discogs OAuth (signing uses unstable values). With **`cacheComponents`**, wrap it in **`<Suspense>`** on [`admin/page.tsx`](../../src/app/admin/page.tsx) and **`await io()`** from **`next/dist/server/request/io`** (same runtime export as **`next/cache`**, but the Next.js TypeScript plugin omits **`io`** on the public entry) before **`verifyAdminFromCookies`** so prerender suspends instead of hitting the blocking-route error.

### Test mocks

[`createMockAppRouter`](../../src/tests/mocks/mockAppRouter.mock.ts) includes **`bfcacheId: ""`** — required by Next.js 16.3 **`AppRouterInstance`** typing in Jest.

### Playwright instant navigation tests

Playwright: **PR CI** runs the **smoke** list ([`smokeSpecs.constants.ts`](../../e2e/smokeSpecs.constants.ts) — file paths locked by [`smokeSpecs.constants.spec.ts`](../../src/tests/utils/smokeSpecs.constants.spec.ts), **chromium** only); **push to `staging`** runs the full matrix below. Smoke includes public/theme/instant routes, authenticated releases/modal/playback/instant-nav, **`POST /api/release/batch`** resilience ([`authenticated-discogs-release-batch-resilience.spec.ts`](../../e2e/authenticated-discogs-release-batch-resilience.spec.ts) partial similar-tail refetch; [`public-playlist.spec.ts`](../../e2e/public-playlist.spec.ts) partial map + transient **503** hydrate), **embed watchdog** (fast **`mode=silent`** wiring + **`onError`** skip; **`normal`** / **`delayed`** cases are **`@full-suite`** and omitted from smoke), **dashboard**, and **settings**. Specs under [`e2e/`](../../e2e/):

