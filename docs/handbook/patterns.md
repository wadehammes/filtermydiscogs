# Patterns

Cross-cutting patterns for auth, global state, data fetching, filtering, and public pages.

## Provider stack

[`src/components/Providers.tsx`](../../src/components/Providers.tsx) nests providers in this order (outer → inner):

1. **QueryClientProvider** — TanStack Query defaults (10 min stale time, limited refetch).
2. **JotaiProvider** — shared Jotai store for client UI state ([`src/atoms/JotaiProvider.tsx`](../../src/atoms/JotaiProvider.tsx)).
3. **ThemeProvider** — light / dark / system preference.
4. **AuthProvider** — OAuth session state.
5. **CollectionContextProvider** — collection pagination metadata only (not the release list).
6. **FiltersProvider** — scope marker for filter hooks (state lives in [`src/atoms/filters.atoms.ts`](../../src/atoms/filters.atoms.ts)).
7. **CrateProvider** — active crate and crate list.
8. **ViewProvider** — scope marker for view hooks (state in [`src/atoms/view.atoms.ts`](../../src/atoms/view.atoms.ts)).

Inside **ViewProvider**: **`LogoutOverlayWrapper`** and **`AuthCheckingToast`**. **`AppToaster`** (Sonner) is a sibling under **ThemeProvider**, outside the auth subtree.

**Jotai** backs **filters** and **view** preference state. Atoms and derived selectors live under [`src/atoms/`](../../src/atoms/); [`src/context/filters.context.tsx`](../../src/context/filters.context.tsx) and [`view.context.tsx`](../../src/context/view.context.tsx) expose scope markers and legacy `useFilters()` / `useView()` for full state. Prefer granular hooks from [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts) so components subscribe only to the slice they need (for example `useSelectedStyles()`, `useFilteredReleases()`, `useCurrentView()`).

**Auth**, **collection**, **crate**, and **theme** still use React context. When adding a new global concern, use **Jotai** for derived client UI state with many subscribers; use **context + reducer** (or React Query) for session lifecycle, server-backed data, or side-effect-heavy flows.

## Authentication flow

1. **Start OAuth**: client navigates to **`GET /api/auth/discogs`**, which reuses stored OAuth tokens when present (no Discogs authorize screen) or starts a fresh OAuth flow. Pass **`?force=1`** to clear tokens and require a new Discogs authorization (e.g. **Use a different Discogs account** on the landing page).
2. **Callback**: **`GET /api/auth/callback`** exchanges verifier for access token, calls **`getIdentity`**, sets cookies, redirects to **`/releases?auth=success`**.
3. **Session check**: **`useAuthQuery`** ([`src/hooks/queries/useAuthQuery.ts`](../../src/hooks/queries/useAuthQuery.ts)) fetches **`/api/auth/check`** via **`checkAuth`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) with **`refetchOnMount: "always"`**. **`AuthProvider`** keeps **`isCheckingAuth`** true until that mount revalidation settles (even if a cached authenticated session exists), then derives **`isAuthenticated`**, **`username`**, **`userId`**, and **`rateLimited`**. Collection queries ([`useCollectionData`](../../src/hooks/useCollectionData.hook.ts)) and crate queries stay disabled while **`isCheckingAuth`** or **`rateLimited`**. When Discogs is rate-limited, the check may return cookie-based identity with **`rateLimited: true`**; the query refetches every 60s (and on window focus) until verification succeeds—those later refetches do **not** flip **`isCheckingAuth`**. If a collection page returns **401**, [`useDiscogsCollectionQuery`](../../src/hooks/queries/useDiscogsCollectionQuery.ts) rechecks auth once (`retry: false` on that query): still authenticated → retry the page once; session gone → update the auth query so **`AuthProvider`** runs **`clearUserScopedQueries`** (never **`queryClient.clear()`**, which would wipe the auth query and refetch forever under **`refetchOnMount: "always"`**) and protected routes redirect home instead of showing a stuck “Not authenticated” error under a logged-in header. On OAuth success, **`refetch`** + **`clearUserScopedQueries`** reset cached user data; **`CrateProvider`** waits until **`isCheckingAuth`** is false before enabling crate queries (avoids a race with that cache clear), resets **`activeCrateId`** when **`userId`** changes, calls **`resetDrawer()`** on first login (null → user id) so the crate drawer follows viewport defaults, **`closeDrawer()`** on logout or user switch, and logs out if crate **`user_id`** does not match the session. Context reducer state is UI-only (**`isLoading`**, **`isLoggingOut`**, OAuth URL **`error`**). **`isLoading`** is reserved for an in-flight OAuth redirect after **Connect with Discogs**. The home page renders the landing immediately while **`isCheckingAuth`** runs, shows a subtle Sonner toast (**`AuthCheckingToast`**) while the session is verified, and redirects authenticated users to **`/releases`** when the check completes.
4. **Logout**: **`POST /api/auth/logout`** ends the app session and clears display cookies by default while **preserving OAuth tokens** for quick re-login on the same browser. Pass **`?preserve_tokens=false`** to revoke stored tokens. Client sets the auth query to unauthenticated, runs **`clearUserScopedQueries`**, and shows **`LogoutOverlay`**. **Clear stored data** (About/Legal) still deletes crates and wipes OAuth tokens.

Cookie names and security flags: [discogs.md](discogs.md).

## Protected routes

Authenticated app routes use [`useRedirectIfUnauthenticated`](../../src/hooks/useRedirectIfUnauthenticated.hook.ts): while **`isCheckingAuth`**, render nothing briefly; when unauthenticated, **`router.replace("/")`**. **`/releases`** streams paginated collection pages into the grid as they arrive; [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) shows [`FiltersBarSkeleton`](../../src/components/StickyHeaderBar/components/FiltersBarSkeleton.component.tsx) until **`allReleasesLoaded`**, then swaps in the real [`FiltersBar`](../../src/components/StickyHeaderBar/components/FiltersBar.tsx). Persisted filter prefs from **`localStorage`** apply only after the full collection load via **`collectionFiltersActiveAtom`** in [`filters.atoms.ts`](../../src/atoms/filters.atoms.ts) (set by [`useCollectionData`](../../src/hooks/useCollectionData.hook.ts)). **`/dashboard`** and **`/mosaic`** still block on first load via [`useNeedsCollectionLoad`](../../src/hooks/useNeedsCollectionLoad.hook.ts) when Jotai has no releases yet.

| Route | While `isCheckingAuth` | When unauthenticated | Collection loading |
|-------|------------------------|----------------------|--------------------|
| `/` | Landing + toast | Landing | — |
| `/releases` | null while checking auth | Redirect to `/` | Stream pages into grid; filter skeleton until done |
| `/dashboard`, `/mosaic` | Header + skeleton/loader (first load only) | Redirect to `/` | Skip when releases already in Jotai |
| `/admin` | Server gate + brief null | Redirect to `/` | — |

Authenticated app routes use segment **`loading.tsx`** with **`AppPageLoading`** ( **`StickyHeaderBar`**, not **`PublicAuthLayout`** ). Root [`loading.tsx`](../../src/app/loading.tsx) is a provider-free **`PageLoader`** only — Next also mounts it under **`/_global-error`**, which replaces the root layout (no **`Providers`**). Root layout failures use [`global-error.tsx`](../../src/app/global-error.tsx) (own document shell; no **`Providers`** / **`useAuth`**).

## Public pages

Server `page.tsx` files for home, about, legal, and public crates share one client shell:

1. **`PublicAuthLayout`** — header (`PublicAuthHeader` → `PublicPageHeader` or authenticated `StickyHeaderBar`), `<main>`, optional `footer`.
2. **`PageFooter`** (server component) — community stats (`PageFooterStats` / `PageFooterFun`) plus About / Contribute links. Pass as the layout `footer` prop from each `page.tsx`.
3. **Page content** — e.g. [`Login`](../../src/components/Login/Login.component.tsx) on `/`, `AboutClient` / `LegalClient`, or public crate client.

Home renders the landing immediately during **`isCheckingAuth`**; authenticated users redirect from `Login` via `router.replace("/releases")`. Protected app routes use **`AppPageLoading`** (see Protected routes above), not a blocking auth shell on `/`.

## API layer

Route outbound browser HTTP through **[`src/api/helpers.ts`](../../src/api/helpers.ts)**—the single front door for collection, crates, search, release fetch, auth check/logout/clear-data, and dashboard stats.

- **Do not** call Discogs or `/api/...` with raw **`fetch`** from components or query hook files.
- **Do not** call Discogs directly from the browser; route handlers sign OAuth requests server-side.
- **Adding a new endpoint**: (1) Add a typed helper in `src/api/helpers.ts`. (2) Add or extend a route handler under `src/app/api/`. (3) Add a dedicated hook under `src/hooks/queries/` that calls the helper in `queryFn`.

## React Query

- **Provider**: [`Providers.tsx`](../../src/components/Providers.tsx) creates **`QueryClient`** and wraps the tree.
- **Hooks**: [`src/hooks/queries/`](../../src/hooks/queries/) — one file per query or mutation bundle.
- **Query keys**: [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts) — use factories everywhere (hooks, invalidation, optimistic cache keys).

| Hook | Key factory | Purpose |
|------|-------------|---------|
| `useAuthQuery` | `AuthQueryKeys.all` | Session check (`/api/auth/check`) |
| `useDiscogsCollectionQuery` | `DiscogsCollectionQueryKeys.byUsername` | Infinite collection pages |
| `useCollectionFieldsQuery` | `CollectionFieldsQueryKeys.byUsername` | Discogs collection custom-field definitions (notes editor) |
| `useCollectionValueQuery` | `CollectionValueQueryKeys.byUsername` | Collection dollar value |
| `useDiscogsReleaseQuery` | `DiscogsReleaseQueryKeys.byId` | Single release fetch |
| `useCratesQuery` / `useCrateQuery` | `CratesQueryKeys` / `CrateQueryKeys` | Crate list and detail (`useCrateQuery` is exported from [`useCratesQuery.ts`](../../src/hooks/queries/useCratesQuery.ts)) |
| `usePublicCrateQuery` | `PublicCrateQueryKeys.byId` | Public crate page |
| `useMostCratedQuery` | `MostCratedQueryKeys.list` | Dashboard stats |
| `useAdminStatsQuery` | `AdminStatsQueryKeys.all` | Admin dashboard |

Hook rules (single params object, no side effects in hook files): [conventions.md → React Query](conventions.md#react-query).

**`useCollectionData`** composes auth state + collection query + context dispatch for the releases/dashboard pages. Invalidate with **`DiscogsCollectionQueryKeys`** when the username changes ([`useCollectionData.hook.ts`](../../src/hooks/useCollectionData.hook.ts), [`auth.context.tsx`](../../src/context/auth.context.tsx)).

**Mutations**: [`useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts) — optimistic updates use the same **`CrateQueryKeys`** / **`CratesQueryKeys`** as queries.

## Filtering and sorting

1. **`useCollectionData`** auto-chains paginated Discogs pages and dispatches **`FiltersActionTypes.SetAllReleases`** after **each** page so the releases grid fills in incrementally. The first fetch is a **bootstrap** page of 50; if more remain, pagination restarts at page size 100 (see [discogs.md](discogs.md) → Client-side collection access). **`collectionFiltersActiveAtom`** stays false until pagination finishes, so persisted **`localStorage`** filter prefs do not winnow the in-progress list. When the last page arrives, **`useCollectionData`** sets **`collectionFiltersActiveAtom`** to true and the saved filters apply. Collection context keeps pagination metadata (`collection`, `fetchingCollection`, `error`) only—not a duplicate release list.
2. **Filter atoms** ([`filters.atoms.ts`](../../src/atoms/filters.atoms.ts)) derive **`filteredReleases`** from filter inputs via:
   - [`filterReleases.ts`](../../src/utils/filterReleases.ts)
   - [`sortReleases.ts`](../../src/utils/sortReleases.ts)
   - [`getAvailableStyles/Years/Formats`](../../src/utils/) for filter chip options (genres and styles share the **Genre & Style** filter via [`releaseGenreStyleTags.ts`](../../src/utils/releaseGenreStyleTags.ts))
   - **Facet options** — each dropdown’s choices come from releases matching the *other* active filters ([`getFacetSourceReleases.ts`](../../src/utils/getFacetSourceReleases.ts)); e.g. with **Rock** selected, year and format lists only show values present on Rock releases, while the genre/style list still reflects search/year/format constraints so you can add another tag.
3. UI components (`FiltersBar`, `FiltersDrawer`, release cards, [`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx)) dispatch filter actions through **`useFiltersDispatch()`** and read state via **`useFilterAtoms`** hooks; **`useFilteredReleases()`** / **`useMemoizedFilteredReleases()`** drive tables, cards, mosaic input, and random release. Dashboard/analytics read the same list via **`useAllReleases()`**.

**Persistence**: User-selected filter inputs (styles, years, formats, sort, style operator, search query) persist in **`localStorage`** under **`filtermydiscogs_filters`** via **`atomWithStorage`** in [`filters.atoms.ts`](../../src/atoms/filters.atoms.ts), with parse/validation in [`filtersStorage.ts`](../../src/utils/filtersStorage.ts). They hydrate into atoms on load but do not affect **`filteredReleases`** until **`collectionFiltersActiveAtom`** is true (full collection fetched). Collection data, random-mode pick, and the searching flag are **not** persisted. Cleared on **Clear stored data** (About/Legal), not on logout—same scope as view mode (one filter state per browser).

**Lint guardrails**: Biome **`noRestrictedImports`** discourages **`useFilters`** / **`useView`** in application code—prefer **`useFilterAtoms`** / **`useViewAtoms`**. Context modules and test files are exempt.

Add filter dimensions by extending filter atoms/helpers and UI—not by filtering ad hoc in leaf components. Release note text is included in search via **`getReleaseNotesSearchText`** in [`filterReleases.ts`](../../src/utils/filterReleases.ts).

## Collection notes (scoped provider)

Release-card notes use a **feature-local provider**, not a global entry in **`Providers.tsx`**:

1. **`ReleaseNotesEditorProvider`** wraps each **`ReleaseCard`** / **`MobileReleaseCard`** and calls **`useReleaseNotesEditor(release)`** once.
2. **`ReleaseNotes`** (`displayOnly`) and **`ReleaseNotesCardAction`** read **`useReleaseNotesEditorContext()`** so the body, **Add notes** link, and icon open the same **`NoteEditDialog`**.
3. Saves go through **`updateCollectionNote`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) → **`POST /api/collection/instances/.../fields/...`** → **`discogsOAuthService.updateCollectionInstanceField`**.

Colocate feature hooks under the component folder ([`useReleaseNotesEditor.hook.ts`](../../src/components/ReleaseNotes/useReleaseNotesEditor.hook.ts)); keep shared React Query hooks in [`src/hooks/queries/`](../../src/hooks/queries/).

## Crates

- **Client**: `CrateProvider` + **`useCrateMutations`** talk to **`/api/crates`** via **`src/api/helpers.ts`**. Components call **`useCrate()`** actions (`updateCrate`, `createCrate`, …) — not mutation hooks directly. Mutation **`onError`** handlers in **`useCrateMutations`** show Sonner toasts and roll back optimistic cache updates; UI handlers only await success and update local dialog state. Crate list (`useCratesQuery`) and active crate releases (`useCrateQuery`) are separate queries — both stay disabled while **`isCheckingAuth`** or **`rateLimited`**; on first login, **`CrateProvider`** invalidates both after **`userId`** arrives, re-selects the default crate, and refetches detail (dropping cached detail first) if list **`releaseCount`** and loaded releases disagree.
- **UI**: [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) sidebar on desktop (≥1024px) and bottom drawer on mobile. On mobile, [`ReleasesClient`](../../src/components/ReleasesClient/ReleasesClient.component.tsx) wraps the drawer in **`.sidebar`** with **`display: contents`** so the bottom drawer is not suppressed by **`display: none`** (fixed UI inside a hidden ancestor never mounts for interaction). **`CrateDrawerProvider`** ([`CrateDrawer.context.tsx`](../../src/components/CrateDrawer/CrateDrawer.context.tsx)) wraps the drawer shell and calls **`useCrateDrawerState`** once; footer, releases list, and confirm/edit dialogs read **`useCrateDrawerContext()`** (same feature-local provider pattern as **`ReleaseNotesEditorProvider`**). **Open/closed state** lives in [`useCrateDrawer`](../../src/hooks/useCrateDrawer.hook.ts): `isDrawerOpen = userToggled ?? isDesktop` (open on desktop, closed on mobile). Use **`openDrawer()`** / **`closeDrawer()`** for explicit user actions; **`resetDrawer()`** clears `userToggled` back to viewport default (login, not duplicate `useMediaQuery` checks in **`CrateProvider`**). **`addToCrate`** opens the drawer only when **`isDesktop`**. Layout shell (sidebar vs bottom drawer) still uses **`useMediaQuery("(max-width: 1023px)")`** in **`CrateDrawer`** — same **1024px** cutoff. After OAuth login, **`CrateProvider`** calls **`resetDrawer()`**; logout/user switch calls **`closeDrawer()`**. Mobile crate FAB sits above the mini player dock (**`z-index`**). [`CrateSelector`](../../src/components/CrateSelector/CrateSelector.component.tsx) (dropdown + circular **New Crate** button), footer actions, [`EditCrateDialog`](../../src/components/EditCrateDialog/EditCrateDialog.component.tsx) modal (rename, **Show gig packing checklist** toggle — **`packed_enabled`**, default off — + type-to-confirm delete), [`CrateNotesDialog`](../../src/components/CrateDrawer/CrateNotesDialog.component.tsx) (**`<dialog>`** modal like release notes). Submit-style crate forms use **React Hook Form** ([conventions.md](conventions.md)). Footer: segmented **Edit / Notes / Default** row plus a separate outline **Empty** button on the right; **Make shareable** checkbox plus **Copy Link** button when public. When **`packed_enabled`** is on, crate list rows use the same vertical action stack as mobile release cards ([`vertical-action-stack.module.css`](../../src/styles/vertical-action-stack.module.css)): **Packed for gig** toggle (persists **`found_at`** via **`setPacked`**) and **remove** (minus icon). Packed rows use muted metadata and a filled check action (no strikethrough); once any item is marked, the releases header shows progress plus **Clear packed** and **Hide packed albums**; **Clear packed** opens a confirm dialog, then resets all packed marks via **`clearAllPacked()`**. Existing **`found_at`** values are kept when the setting is off.
- **Server**: handlers scope all rows by **verified OAuth user ID** from **`getVerifiedUserFromRequestWithRateLimit`**; store optional **`username`** on public crates.
- **Public view**: [`/crate/[id]`](../../src/app/crate/[id]/page.tsx) loads SEO metadata via **`fetchPublicCrateMetadata`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts) → [`public-crate.server.ts`](../../src/lib/public-crate.server.ts)) and client data via **`usePublicCrateQuery`**. [`PublicCrateClient`](../../src/app/crate/[id]/PublicCrateClient.tsx) wraps the release grid in **`ReleasePlaybackProvider`**, shows optional crate **notes** under the title when set, and opens **`PublicReleaseModal`** from cover art (tracklist + mini player; no collection notes or filter pills).

See [database.md](database.md) for schema details.

## Dashboard analytics

- **Page**: [`/dashboard`](../../src/app/dashboard/page.tsx) → [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx).
- **Data**: **`useAllReleases()`** from Jotai + **`useCollectionAnalytics`** for computed stats; **`useCollectionValueQuery`** for Discogs collection dollar value; **Recharts** for charts.
- **Types**: [`src/types/dashboard.types.ts`](../../src/types/dashboard.types.ts).

## Mosaic generator

- **Page**: [`/mosaic`](../../src/app/mosaic/page.tsx) → [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) (client `dynamic` with `ssr: false`; [`AppPageLoading`](../../src/components/AppPageLoading/AppPageLoading.component.tsx) while the chunk loads) → [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx).
- **Hook**: [`useMosaicGenerator`](../../src/hooks/useMosaicGenerator.hook.ts) builds canvas grids from filtered releases.
- **Images**: [`src/utils/imageLoader.ts`](../../src/utils/imageLoader.ts) fetches resized covers via **`GET /api/image-proxy`** (Sharp server-side). Production builds use **`next build --webpack`** so Sharp’s linux-x64 binaries are traced into the Vercel function (default Turbopack hashed externals break this).

## Clear stored data

About/Legal **Clear stored data** calls **`clearData`** in [`src/api/helpers.ts`](../../src/api/helpers.ts) → **`POST /api/auth/clear-data`**, which deletes the user's crates and clears session cookies. Client reset uses **`useCollectionReset`** ([`useCollectionReset.hook.ts`](../../src/hooks/useCollectionReset.hook.ts)) and **`clearClientStoredData`** ([`clearClientStoredData.ts`](../../src/utils/clearClientStoredData.ts)) to remove filter preferences, view state, theme, legacy crate migration data, release playback resume state, and the dock video intro flag from **`localStorage`**. Logout clears playback only—not filter or view preferences.

## Metadata and OG images

- Root metadata defaults in [`src/app/layout.tsx`](../../src/app/layout.tsx).
- Per-route metadata in `page.tsx` files (e.g. public crate title/description).
- Default social images: static [`opengraph-image.png`](../../src/app/opengraph-image.png) and [`twitter-image.png`](../../src/app/twitter-image.png) in `src/app/` with matching [`opengraph-image.alt.txt`](../../src/app/opengraph-image.alt.txt) / [`twitter-image.alt.txt`](../../src/app/twitter-image.alt.txt). Shared alt text and metadata objects live in [`src/constants.ts`](../../src/constants.ts) (`DEFAULT_OPEN_GRAPH_IMAGE`, `DEFAULT_TWITTER_IMAGE`). Per-route metadata references those constants with `metadataBase` from [`layout.tsx`](../../src/app/layout.tsx).
- Dynamic OG routes: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx) for public crate shares.

Do not add a dynamic `opengraph-image.tsx` alongside the PNG; the code route overrides the static file and replaces the app preview art.

## Constants and env

- Shared literals live in [`src/constants.ts`](../../src/constants.ts) and topic files under [`src/constants/`](../../src/constants/) (e.g. **`SortValues`**, mosaic sizes)—not magic strings in components.
- Runtime **`process.env.*`** keys that must reach the browser need to be listed under **`env`** in [`next.config.ts`](../../next.config.ts). OAuth secrets stay **server-only** unless intentionally exposed for OAuth initiation.
- URL helpers: [`getSiteUrl`](../../src/utils/helpers.ts) for site base URLs.

## Admin dashboard

**`/admin`** is gated by **`ADMIN_USER_ID`** env matching the `discogs_user_id` cookie. Stats come from **`/api/admin/stats`** via **`useAdminStatsQuery`**.

## Testing

Jest layout, page objects, factories, and mock boundaries: **[conventions.md → Testing](conventions.md#testing)**.

## Release playback queue

- **Scope (v1)**: Album queue — flattened tracks from the current release via **`ReleasePlaybackProvider`**.
- **Placement**: Provider wraps **`ReleasesClient`** only (not global **`Providers`**). Closing **`ReleaseModal`** does not stop playback.
- **UI**: [`ReleaseMiniPlayer`](../../src/components/ReleasePlayback/ReleaseMiniPlayer.component.tsx) is a slim background-playback dock (cover, title, prev/play-pause/next/stop). By default the YouTube embed is hidden (audio-only). A **video** control toggles a 16:9 panel ([`ReleasePlaybackVideoPanel`](../../src/components/ReleasePlayback/ReleasePlaybackVideoPanel.component.tsx)). The dock video panel **auto-expands once** the first time playback becomes ready in the bar (tracked in **`localStorage`** via [`playbackVideoIntroStorage.ts`](../../src/utils/playbackVideoIntroStorage.ts)) so listeners discover the control; later sessions still **auto-expand whenever autoplay playback starts** (e.g. a track row click in **`ReleaseModal`**, or prev/next in the dock) unless the listener collapsed the panel with the video control or close bar. Restore-after-refresh playback starts **paused** and keeps the panel collapsed until the listener taps play. On **mobile**, the panel is full viewport width, docked above the mini-player bar, with a top close bar (no drag/resize). On **desktop** it defaults above the transport controls, right-aligned at full size as a floating panel — drag the top handle to reposition, drag the bottom-right handle to shrink (not enlarge), and double-click the top handle to reset layout; layout persists for the browser session until the viewport crosses back from mobile to desktop or a stored position no longer fits the viewport, when position and scale reset to that default. Native browser PiP is not used — YouTube iframe embeds do not expose reliable programmatic PiP from app code. Cover/title opens **`ReleaseModal`**. Play/pause sends YouTube iframe commands via **`togglePlayback`**. [`PersistentYoutubeIframe`](../../src/components/ReleasePlayback/PersistentYoutubeIframe.component.tsx) keeps a single embed mounted in the dock; when collapsed it stays off-screen for audio-only playback. Embeds use **`playsinline=1`** for iOS. A track row click in **`ReleaseModal`** calls **`startPlayback`**; closing the modal does not stop playback. **`startPlayback`** schedules **`playVideo`** iframe commands (with retries up to 3s) and **`resumePlaybackFromGesture`** re-fires when the embed becomes visible so mobile track picks can start after the panel opens. Prev/next advance within the current release tracklist (no auto-advance on video end in v1) and keep the video panel open when it was already expanded.
- **Resume after refresh**: **`startPlayback`** writes `{ instanceId, trackPosition }` to **`localStorage`** immediately; the provider keeps it updated while playback is active. On **`/releases`**, restore waits for auth (`isCheckingAuth`), the collection to finish loading (`collection !== null`, not fetching), and any remaining pages (`collection.pagination.urls.next`) before giving up. Restore reopens the dock **paused** — browsers block autoplay without a user gesture, so the listener taps play to resume audio. Cleared on stop, logout, and **Clear stored data**.
