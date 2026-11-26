## Public pages

Server `page.tsx` files for home, about, legal, and public crates share one client shell:
1. **`PublicAuthLayout`** — header (`PublicAuthHeader` → `PublicPageHeader` or authenticated `StickyHeaderBar`), `<main>`, optional `footer`.
2. **`PageFooter`** (server component) — community stats (`PageFooterStats` / `PageFooterFun`) plus About and **Contribute to the project** (links to **`/about#support`**). Pass as the layout `footer` prop from each `page.tsx`.
3. **Page content** — e.g. [`Login`](../../src/components/Login/Login.component.tsx) on `/`, [`AboutClient`](../../src/components/About/AboutClient.component.tsx) / [`LegalPageContent`](../../src/components/Legal/LegalPageContent.server.tsx), or [`PublicCrateClient`](../../src/components/PublicCrate/PublicCrateClient.component.tsx).

Home renders the landing during **`isCheckingAuth`** with **`AuthCheckingToast`** for session verification; authenticated users redirect from **`Login`** via `router.replace("/collection")`. Protected app routes use **`AppPageLoading`** or **`ReleasesPageLoading`** on **`/collection`** (see Protected routes above), not a blocking auth shell on `/`.
