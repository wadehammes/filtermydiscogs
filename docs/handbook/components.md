# Components

How UI is organized under `src/components/` and how we test it.

## Folder layout

- **Feature components**: [`src/components/<Name>/`](../../src/components/) — one folder per component or feature area; **no nested `components/` or `shared/` tiers**. Typically:
  - `Name.component.tsx` — main React export (arrow function, typed props)
  - `Name.module.css` — scoped styles
  - Optional `Name.spec.tsx` + `Name.po.tsx` for tested components (see [conventions.md → Testing](conventions.md#testing))
  - Related pieces are **sibling folders** (e.g. [`ReleaseModal/`](../../src/components/ReleaseModal/) shell + [`ReleaseTracklist/`](../../src/components/ReleaseTracklist/) + [`ReleaseSummaryHero/`](../../src/components/ReleaseSummaryHero/) — not nested under one mega-folder)

- **Shared primitives**: same flat layout under **`src/components/`** — [`AppDialog/`](../../src/components/AppDialog/), [`ScrollModal/`](../../src/components/ScrollModal/), [`ModalToolbar/`](../../src/components/ModalToolbar/), [`TanstackChart/`](../../src/components/TanstackChart/), etc. UI icons (SVG + TSX Turbopack fallbacks) live in [`src/styles/icons/`](../../src/styles/icons/) — see [conventions.md → SVG icons](conventions.md#jest-notes). **Base UI** ([`@base-ui/react`](https://base-ui.com/react/overview/quick-start)) powers headless overlays and pickers: [`AppDialog/`](../../src/components/AppDialog/) (controlled **`Dialog`** shell: backdrop + centered popup, focus trap, Escape/backdrop dismiss; **`modal="trap-focus"`** so Base UI does not lock document scroll — overlays call **`usePlaybackPageScrollLock`** from **[`PlaybackPageShell.context.tsx`](../../src/components/PlaybackPageShell/PlaybackPageShell.context.tsx)** to lock the shell scroll root via ref-counted **`lockScroll`/`unlockScroll`**), [`ScrollModal/`](../../src/components/ScrollModal/) (scrollable card modal built on **`AppDialog`**), plus feature components on **`Select`**, **`Combobox`**, and **`Menu`** — filter controls ([`Select/`](../../src/components/Select/), [`AutocompleteSelect/`](../../src/components/AutocompleteSelect/)), header/crate menus ([`UserActions`](../../src/components/StickyHeaderBar/UserActions.tsx), [`CrateDetailActionsMenu`](../../src/components/Crates/CrateDetailActionsMenu.component.tsx)). Global portal setup: [`.appRoot`](../../src/app/layout.tsx) + [`base-ui-setup.css`](../../src/styles/global/base-ui-setup.css) (`isolation: isolate`; `body { position: relative }` for iOS Safari backdrops). Shared backdrop tokens: [`base-ui-portal.module.css`](../../src/styles/modules/base-ui-portal.module.css). Dashboard charts: [`TanstackChart/`](../../src/components/TanstackChart/) (motion renderer host + shared axis/grid/tooltip styling), [`GrowthAreaChart/`](../../src/components/GrowthAreaChart/) (admin growth areas), [`PieChartLegend/`](../../src/components/PieChartLegend/) (HTML percent labels under donut pies). [`ModalToolbar/`](../../src/components/ModalToolbar/) (microdot toolbar: optional left actions, optional **`title`**, close **X**).

- **Providers**: [`src/components/Providers.tsx`](../../src/components/Providers.tsx) — root QueryClient + context stack. Global toasts use **[Sonner](https://sonner.emilkowal.ski/)** via [`AppToaster`](../../src/components/AppToaster/AppToaster.component.tsx) (portaled to **`document.body`**, **`--z-8-toast`** above modals/tooltips): **`richColors`**, app token styling in [`global/sonner.css`](../../src/styles/global/sonner.css) (maps Sonner CSS variables to **`--card`**, **`--destructive`**, etc. so every palette theme matches), and **`toSonnerTheme`** for Sonner’s light/dark shell. Import **`toast`** from **`sonner`** for user feedback — prefer toasts over **`alert()`** for non-blocking errors and success messages. Auth session feedback on `/` uses [`AuthCheckingToast`](../../src/components/AuthCheckingToast/AuthCheckingToast.component.tsx). Analytics consent uses [`CookieConsentBanner`](../../src/components/CookieConsentBanner/CookieConsentBanner.component.tsx) inside **`AnalyticsShell`** (theme tokens + fixed-bottom chrome aligned with **`ReleaseMiniPlayer`**).
- **Public pages**: [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) is the single client shell for home, about, legal, and public crate pages (`data-testid="fmdPublicAuthLayout"`). Server `page.tsx` files pass [`PageFooter`](../../src/components/Page/PageFooter.server.tsx) as the `footer` prop. [`PublicAuthHeader`](../../src/components/PublicAuthLayout/PublicAuthHeader.component.tsx) renders [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) for visitors or [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) when `authenticatedNavPage` is set and the user is signed in. Props: `currentPage` (`home` \| `about` \| `legal`), `centerMain` (home), `authenticatedNavPage`, optional `header` override, optional `footer`.
- **Landing page**: [`Login.component.tsx`](../../src/components/Login/Login.component.tsx) (`data-testid="fmdLogin"`) is the home page body: intro heading (**`SITE_NAME`** in **`.visuallyHidden`**, visible **`SITE_TAGLINE`** / **`SITE_LEAD`**), [`LoginPreviewDemo`](../../src/components/Login/LoginPreviewDemo.component.tsx), OAuth hero + bottom CTAs ([`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx), [`LoginBottomCta`](../../src/components/LoginBottomCta/LoginBottomCta.component.tsx)), and feature rows ([`LoginFeatureRow`](../../src/components/LoginFeatureRow/LoginFeatureRow.component.tsx) + [`loginFeatures.constants.ts`](../../src/components/Login/loginFeatures.constants.ts)). Marketing strings are centralized in [`loginPageCopy.registry.ts`](../../src/constants/loginPageCopy.registry.ts) and validated by [`loginPageCopyLiteraryRules.spec.ts`](../../src/tests/utils/loginPageCopyLiteraryRules.spec.ts) (no em dashes, embellishment, or inaccurate claims). The crates row highlights the owner detail page: reordering, set markers, set notes, gig packing, and public sharing. Styles: [`Login.module.css`](../../src/components/Login/Login.module.css). Theme screenshots: [`LoginFeatureVisual`](../../src/components/Login/LoginFeatureVisual.component.tsx). Home JSON-LD: [`HomeJsonLd`](../../src/components/Login/HomeJsonLd.component.tsx) on [`page.tsx`](../../src/app/page.tsx). [`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx) shows the Discogs SVG with **“Connect with Discogs”** as the accessible name (visible “Discogs” text is `.visuallyHidden` from [`accessibility.module.css`](../../src/styles/modules/accessibility.module.css)). Use it for **every OAuth connect CTA** (landing hero/bottom, public crate “Get Started”, etc.); wire `onClick` to [`useAuth().login`](../../src/context/auth.context.tsx). Public nav **“Log in”** in [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) is a plain **`<a href="/api/auth/discogs">`** (full document navigation — not **`next/link`**) so token reuse and OAuth redirects apply cookies correctly. Visitors use **`system`** theme (OS light/dark); theme selection is in **Settings** after login.

## Naming

- Prefer **`.component.tsx`** for the main React export in a feature folder.
- **Client page shells** use **`*Client.tsx`** or **`*Client.component.tsx`** imported from a server `page.tsx`.
- Keep **one primary component file** per folder unless the feature is large enough to justify split files (hooks, subcomponents).

## CSS Modules

Import as `import styles from "./Name.module.css"` and reference **`styles.className`**. Use **`classNames`** whenever classes are combined or conditional — static lists, object notation for state, and optional `className` props (see [conventions.md → React / JSX](conventions.md#react--jsx)). Do **not** cast module keys with **`as string`** in object notation. Single unconditional module classes may use `className={styles.block}` directly.

## Scaffolding

Run **`pnpm scaffold <ComponentName>`** ([`scripts/scaffold.sh`](../../scripts/scaffold.sh)) to generate:

- `Name.component.tsx` with root **`data-testid="fmd<Name>"`**
- `Name.module.css`
- `Name.spec.tsx` (assertions via **`screen`**; imports PO first)
- `Name.po.tsx` with typed **`renderName(overrides)`**, defaults + `{...overrides}`, and optional private **`*Element()`** helper (see [conventions.md → Testing](conventions.md#testing))

Add factories under **`src/tests/factories/`** when structured test data is needed.

## Links and media

- Internal routes: **`next/link`** or **`useRouter`** from `next/navigation`.
- Discogs release/artist/label URLs: **`getResourceUrl`** from [`src/utils/helpers.ts`](../../src/utils/helpers.ts).
- Cover art: **`next/image`** with Discogs CDN URLs (`i.discogs.com`).

## Test IDs

- Component root: **`data-testid="fmd<ComponentName>"`** (PascalCase component name).
- Page object **`testId`** must match exactly.
- Specs query with **`screen.getByTestId(po.testId)`** after PO render setup.

## Testing

- Colocate specs with the component when adding coverage (`*.spec.tsx`; optional **`*.po.tsx`**).
- Use **`render`** from **`test-utils`** when auth, filters, or crate context is required **without** mocking (default wrapper is **`TestProviders`**). Context-heavy component tests usually mock context in the PO and use **`render`** instead (see [conventions.md → Testing](conventions.md#testing)).
- **Page composition in POs**: When production mounts a component inside a layout plus server footer (e.g. home = `PublicAuthLayout` + `PageFooter` + `Login`), the PO **`render*`** helper should mirror that tree. Put **`jest.mock("src/components/Page/PageFooter.server")`** in the PO and render `<PageFooter />` in the layout’s `footer` prop—do not inline a partial footer that omits links the spec asserts on.

## Exports

Import from the **concrete module path** (e.g. `src/components/ReleaseCard/ReleaseCard.component.tsx`). Avoid new barrel **`index.ts`** files.

## Feature example: ReleaseCard (desktop grid)

[`ReleaseCard`](../../src/components/ReleaseCard/ReleaseCard.component.tsx) and **`PublicReleaseCard`** share [`ReleaseCard.module.css`](../../src/components/ReleaseCard/ReleaseCard.module.css). Body copy lives in [`ReleaseCardContent`](../../src/components/ReleaseCard/ReleaseCardContent.component.tsx).

| Concern | Pattern |
|---------|---------|
| Shell | Inset **`1px`** stroke via **`box-shadow`** on **`--border`** (no physical **`border`** — keeps cover art flush with rounded corners); **`--shadow-sm`** at rest; hover swaps stroke to **`--input`** and lifts to **`--shadow-lg`** |
| Cover | **`.imageContainer`** has no corner radius — **`.releaseCard`** **`overflow: hidden`** clips the blurred background; centered thumb keeps its own **`--radius-card`** |
| Highlight | **`.highlighted`** — **`2px`** primary inset stroke in **`box-shadow`** (plus highlight glow shadows; composes **`theme-highlighted-surface`**) |
| In crate | **`.inCrate`** — primary **`outline`** on the card shell |
| Notes | Cover overlay **`ReleaseNotesCardAction`** only — no inline note body on the card |

## Feature example: MobileReleaseCard

[`src/components/ReleaseCard/MobileReleaseCard.component.tsx`](../../src/components/ReleaseCard/MobileReleaseCard.component.tsx) is the **mobile** release row (image | content | action column). **`PublicMobileReleaseCard`** shares **`MobileReleaseCard.module.css`**.

| Concern | Pattern |
|---------|---------|
| Shell | **`1px`** border on **`--border`**; **`--shadow-sm`** at rest; hover darkens border to **`--input`** and lifts to **`--shadow-md`** |
| Layout | Horizontal flex: fixed **`7rem`** cover, **`flex: 1 1 0`** content (**`min-width: 0`**), **`4rem`** action column with full-height overlay actions. **Random view** on mobile uses desktop [`ReleaseCard`](../../src/components/ReleaseCard/ReleaseCard.component.tsx) (vertical showcase) via [`ReleasesGrid`](../../src/components/ReleasesClient/ReleasesGrid.component.tsx)—not this row layout |
| Cover | **`.imageContainer`** has no corner radius — card **`overflow: hidden`** clips the cover column; inner **`img`** / **`releaseImage`** keep left-edge radius via **`calc(var(--radius-card) - var(--release-card-border-width))`** |
| Loading | [`MobileReleaseCardSkeleton`](../../src/components/ReleasesClient/MobileReleaseCardSkeleton.component.tsx) mirrors this row layout while collection pages stream in; desktop uses [`DesktopReleaseCardSkeleton`](../../src/components/ReleasesClient/DesktopReleaseCardSkeleton.component.tsx) |
| Pills | **`HorizontalScrollRow`** — wrapper needs **`min-width: 0`** + **`overflow: hidden`** so pill rows scroll horizontally instead of wrapping (same component in [`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx)) |
| Title block | Artist + title + meta grouped in **`.releaseInfo`** with **`titleGroupMobile`** / **`metaLineMobile`** / **`catalogRowMobile`** for tight internal spacing; pills keep looser outer gaps |
| Highlight | **`.highlighted`** — **`2px`** primary border + **`theme-highlighted-surface`** |
| In crate | **`.inCrate::after`** draws a full-card primary ring on top of artwork (do not use inset **`box-shadow`**—cover art hides the left edge) |
| Notes | Action column **`ReleaseNotesCardAction variant="mobile"`** only — no inline note body on the card |
| Open detail modal | Cover art or **Release details** overlay button call optional **`onReleaseClick`**; title links to Discogs in a new tab |
| Overlay actions | **`ReleaseCardOverlayActions`**: release details (menu icon), View on Discogs (external link), notes, crate — desktop segmented row on cover; mobile full-height column with **`border-top`** separators (no inner frame) |

## Feature example: CrateDrawerReleaseItem

[`CrateDrawerReleaseItem`](../../src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component.tsx) + [`CrateDrawerReleaseActions`](../../src/components/CrateDrawerReleaseActions/CrateDrawerReleaseActions.component.tsx) render each release row in the **`/releases`** drawer and share the same horizontal layout as **`MobileReleaseCard`** (cover | meta | **`4rem`** action column). Styles live in [`CrateDrawerReleaseItem.module.css`](../../src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css); actions compose [`vertical-action-stack.module.css`](../../src/styles/modules/vertical-action-stack.module.css).

| Concern | Pattern |
|---------|---------|
| Shell | **`--card`** background; **`1px`** border on **`--border`**; **`--shadow-sm`** at rest; hover darkens border to **`--input`** and lifts to **`--shadow-md`** — do **not** swap the row to **`--muted`** (avoids a harsh cover vs. text split on warm palettes) |
| Layout | Clickable main area (cover + artist/title/meta) opens **`ReleaseModal`**; action column is a full-height stack separated by **`border-left`** |
| Packed | **`.listItemFound`** — primary outer border when **`packed_enabled`** and release is marked packed; packed toggle sets **`aria-pressed`** |
| Action hover | Default stack buttons tint with **`color-mix(..., var(--card))`**; packed toggle keeps primary fill on hover; remove uses a destructive tint on **`--card`**, not **`--background`** |

## Feature example: ReleasesTable

[`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx) is the desktop **list** view on **`/releases`** when view mode is list (see [architecture.md](architecture.md) → view atoms). TanStack Table renders checkbox, cover, artist/title, label, year, **Format/Styles**, and notes columns.

| Concern | Pattern |
|---------|---------|
| Format/Styles column | Format pills plus genre/style tags from [`getReleaseGenreStyleTags`](../../src/utils/releaseGenreStyleTags.ts), wrapped in **`HorizontalScrollRow`** inside a fixed-width cell (**`min-width: 0`**) so tags scroll horizontally instead of wrapping |
| Column resizing | TanStack Table v9 **`columnResizingFeature`**: drag header edges to resize (double-click resets); widths persisted in **`localStorage`** via **`RELEASES_TABLE_LAYOUT_STORAGE_KEY`** ([`useReleasesTableLayout.hook.ts`](../../src/components/ReleasesTable/useReleasesTableLayout.hook.ts)). Each resizable header uses a **`<button type="button">`** handle (**`aria-label`**, wide hit area, 3px **`::after`** rail) — not a static **`<div>`** — so Biome **`noStaticElementInteractions`** passes. Wide tables scroll inside **`.tableContainer`** — **`min-width: 0`** on **`.mainContent`** (releases grid) and table wrappers keeps the crate sidebar in the layout |
| Filter pills | Same **`usePillClickHandler`** / **`useFilterAtoms`** wiring as release cards — pills toggle format and genre/style filters |
| Notes | **`ReleaseNotes variant="table"`** — no per-row **`ReleaseNotesEditorProvider`** (see ReleaseNotes feature example) |

## Feature example: ReleaseModal

[`ReleaseModal/`](../../src/components/ReleaseModal/) is the release detail dialog shell on **`/releases`**, **`/dashboard`**, and owner **`/crates/[id]`**. Body, hero, tracklist, similar sidebar, and public variants live in sibling folders (see table). Opened when the user clicks cover art or title on a collection card (via **`onReleaseClick`** from [`useSelectedReleaseModal`](../../src/hooks/useSelectedReleaseModal.hook.ts) — also used by [`useReleasesClient`](../../src/hooks/useReleasesClient.hook.ts) on **`/releases`**).

**URL routing:** Modal open state syncs to **`?instance=<instance_id>`** ([**`RELEASE_MODAL_INSTANCE_PARAM`**](../../src/constants.ts)) on the current page. Every open and similar-sidebar switch **`router.push`**es (preserving other query params) so browser **Back** walks through viewed releases; explicit close (**X**, Escape, backdrop) **`router.replace`**s to the URL captured before the first open in that session; landing on a direct link with **`?instance=`** closes via **`router.replace`** to strip the param. Unknown instance ids leave the modal closed (**`isOpen={selectedRelease !== null}`**). Helpers: [`releaseModalUrl.ts`](../../src/utils/releaseModalUrl.ts). Host pages that call **`useSearchParams`** wrap the client in **`<Suspense>`** ([**`/releases`**](../../src/app/releases/page.tsx), [**`/dashboard`**](../../src/app/dashboard/page.tsx); crate routes already do).

| File | Role |
|------|------|
| `ReleaseModal.component.tsx` | Backdrop + scroll shell via **`ScrollModal`**, hero header (cover, metadata, crate/Discogs/close), scrollable body, analytics on open. When similar collection matches exist, uses **`useMediaQuery("(min-width: 1024px)")`**: desktop (≥1024px) sets **`modalWide`** (**`--scroll-modal-max-width: 68rem`**) and mounts **`ReleaseSimilarSidebar`** in **`ScrollModal`** **`aside`** with full-width **`ReleaseSummaryHeroToolbar`** in the **`toolbar`** slot (hero omits its toolbar); mobile keeps the standard modal shell and passes similar matches to the body |
| `ReleaseModalBody.component.tsx` | Tracklist via **`useReleaseModalPlayback`**, notes, then on mobile (**`<1024px`**) an inline **`ReleaseSimilarSidebar`** card below notes |
| `ReleaseSimilarSidebar.component.tsx` | **`variant="aside"`** (desktop **`ScrollModal`** column — independently scrollable list) or **`variant="inline"`** (mobile card in main scroll). Shared genres/styles via **`getSimilarReleases`** ([`similarReleases.ts`](../../src/utils/similarReleases.ts)) |
| `ReleaseSimilarReleaseItem.component.tsx` | Crate-drawer-style row (**`CrateDrawerReleaseItem`** layout + compact overrides in **`ReleaseSimilarReleaseItem.module.css`**) with add/remove crate action; **`.listItemInCrate`** primary border when staged in the crate; row click calls **`onReleaseClick`** |
| `ReleaseSummaryHeroToolbar.component.tsx` | Crate/Discogs/close toolbar extracted for the desktop split layout when similar matches exist; in-crate crate toggle uses **`ModalToolbar`** **`.actionButtonActive`** (primary fill) |
| `useSimilarReleasesInCollection.hook.ts` | Memoized similar-release list from **`allReleasesAtom`** (limit **`SIMILAR_RELEASES_LIMIT`**); exposes **`isSimilarLoading`** while collection pagination is in flight |
| `ReleaseSummaryHero.component.tsx` | Shared **`ModalToolbar`** (crate, Discogs, close **X**) + stacked cover/metadata on mobile, side-by-side on desktop; catalog meta line, then **`ReleaseHeroRatingsRow`** (personal stars + community average), then clickable format pills plus genre/style tags from **`getReleaseGenreStyleTags`** |
| `ReleaseHeroRatingsRow.component.tsx` | One ratings row — **`ReleasePersonalRating`** (authenticated) + community average, `·`-separated when both present |
| `ReleasePersonalRating.component.tsx` | Auth-only wrapper mounting **`useReleaseRatingEditor`** + **`ReleaseRatingPicker`** |
| `ReleaseRatingPicker.component.tsx` | Native **`<input type="radio">`** stars in a **`<fieldset>`**; hover preview highlights included stars and dims higher stars |
| `useReleaseRatingEditor.hook.ts` | Rating write handler, optimistic **`allReleasesAtom`** updates, collection + release query invalidation |
| `PublicReleaseModal.component.tsx` | Public crate variant — **`ScrollModal`** shell, **`PublicReleaseSummaryHero`** + **`PublicReleaseModalBody`** (tracklist only) |
| `PublicReleaseSummaryHero.component.tsx` | Discogs + close toolbar; catalog meta + **`ReleaseHeroRatingsRow`** (community average only); static format pills plus genre/style tags from **`getReleaseGenreStyleTags`** (no filter actions, no crate toggle) |
| `PublicReleaseModalBody.component.tsx` | Tracklist/playback only — no notes section |
| `ReleasePlaybackFallback.component.tsx` | YouTube search + external video links when no embeddable video is available |
| `ReleasePlaybackPreview.component.tsx` | Below the tracklist: **`ReleaseTracklist`** with **`hideTrackPosition`** for embeddable videos not matched to any track (**`getReleasePreviewVideos`**) — title-only left column (no position), duration, add to queue, row click to play |
| `ReleaseTracklist.component.tsx` | Track rows are clickable only when **`isTrackPlayable`** returns true (title-matched embeddable video); otherwise static text rows with muted titles and no hover. Optional **`hideTrackPosition`** drops the position column (preview videos). **`reserveQueueColumn`** keeps an empty queue slot on non-playable rows so durations align with playable rows and preview videos. Per-track **`artists`** / **`extraartists`** credits on Various Artists comps; visible **Add to queue** (list-plus icon) on playable rows; animated bars or pause icon on the dock’s active track |
| `useReleaseModalPlayback.hook.ts` | Modal playback state; track select calls **`startPlayback`**; **`handleTrackQueue`** calls **`addToQueue`** |

**Similar in your collection:** **`getSimilarReleases`** scores other collection items with weighted tag overlap — **styles** count more than **genres** — plus small boosts for shared **label** (by Discogs **`labels[].id`**, with name fallback) and nearby **year** (±5), and a **same-artist penalty** (by **`artists[].id`**, with name/ANV fallback) so gig-list discovery favors different artists with a similar vibe. Results dedupe to **one row per Discogs release id** (`basic_information.id` via **`parseReleaseId`**) and **one per `master_id`** (highest score wins). Excludes the open instance, other collection copies of the same release id, and same **`master_id`** as the source. Candidates must share at least one genre/style tag; untagged sources return no matches. Similar matches are computed only after the full collection has loaded; until then **`ReleaseSimilarSidebar`** shows **`PageLoader`** (**`Loading similar releases…`**, same pattern as crate drawer loading). Returns up to **`SIMILAR_RELEASES_LIMIT`** (8) matches sorted by score then title. Covered by [`ReleaseModal.similar.spec.tsx`](../../src/components/ReleaseModal/ReleaseModal.similar.spec.tsx) (mobile inline placement + desktop aside; **`ReleaseModal.po`** exports **`mockUseMediaQuery`** for breakpoint tests).

## Feature example: ReleasePlayback

Persistent background playback is split across sibling component folders. **`ReleasePlaybackProvider`** ([`releasePlayback.context.tsx`](../../src/context/releasePlayback.context.tsx)) and **`GlobalPlaybackDock`** are mounted in global **`Providers`** so the dock and YouTube iframe survive client-side navigation. Playback-enabled pages register modal open handlers with **`useRegisterPlaybackReleaseClick`** ([`playbackReleaseClick.context.tsx`](../../src/context/playbackReleaseClick.context.tsx)).

| File | Role |
|------|------|
| [`GlobalPlaybackDock.component.tsx`](../../src/components/GlobalPlaybackDock/GlobalPlaybackDock.component.tsx) | Fixed viewport dock; sets **`data-global-playback-dock`** when **`isPlaying`** and loads [`playback-dock.module.css`](../../src/styles/modules/playback-dock.module.css) (`:global` layout tokens on **`html:has([data-global-playback-dock])`**, spacers, queue z-index). Renders **[`ReleaseMiniPlayer`](../../src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component.tsx)**. |
| [`PlaybackPageShell.component.tsx`](../../src/components/PlaybackPageShell/PlaybackPageShell.component.tsx) | Shared flex layout: optional **`header`**, scrollable **`main`** (`data-playback-page-shell-main`), optional **`overlays`**. Wraps children in **[`PlaybackPageShellProvider`](../../src/components/PlaybackPageShell/PlaybackPageShell.context.tsx)** (scroll root + ref-counted overlay lock). **`fillViewport`** pins the shell to **`100dvh`** (dashboard, **`/admin`**, **`/releases`**, owner crate detail); internal-scroll pages must not put **`flex: 1` / `min-height: 0`** on direct children of **`mainScroll`** or the scroll area will not grow. Public **`/crate/[id]`** scrolls with **`PublicAuthLayout`** instead (see [patterns.md](patterns.md)). With an external **`scrollElement`** ( **`/releases`** only), appends **`[data-playback-dock-spacer]`** so the workspace shrinks above the fixed dock via [`playback-dock.module.css`](../../src/styles/modules/playback-dock.module.css) (loaded from **[`GlobalPlaybackDock`](../../src/components/GlobalPlaybackDock/GlobalPlaybackDock.component.tsx)**). Internal scroll paths append **[`PlaybackScrollSpacer`](../../src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component.tsx)** automatically; external scroll callers mount it inside their scroll root. Context exports **`usePlaybackPageScrollElement`**, **`usePlaybackPageScrollLock`** (overlay open → increment lock; DOM **`overflow`** lock on the scroll root when mounted — see [`playbackPageScrollLock.ts`](../../src/components/PlaybackPageShell/playbackPageScrollLock.ts)), and **`usePlaybackPageScrollLockCountRef`** (synchronous overlay count for deferring bottom toasts while drawers/modals are open). Consumers: **[`BackToTop`](../../src/components/BackToTop/BackToTop.component.tsx)**, infinite scroll on **`/releases`**, **[`AppDialog`](../../src/components/AppDialog/AppDialog.component.tsx)**, **[`BottomDrawer`](../../src/components/BottomDrawer/BottomDrawer.component.tsx)**. |
| [`BottomDrawer.component.tsx`](../../src/components/BottomDrawer/BottomDrawer.component.tsx) | Mobile bottom sheet (crate drawer, filters drawer, mobile menu, playback queue): portaled to **`document.body`**, **`position: fixed`**, slide-up animation. **`usePlaybackPageScrollLock(isOpen)`** while open. **`max-height`** uses **`svh`** and clears **`--sticky-header-total-height`** ( **`aboveMiniPlayer`** / **`behindMiniPlayer`** adjust for the mini-player dock — see module CSS). Optional **`dataAttribute`** on the overlay (e.g. **`data-filters-drawer-open`**, **`data-mobile-menu-open`**, **`data-playback-queue-open`**) for global layout hooks. Scroll inside **`.content`** only. |
| `ReleaseMiniPlayer.component.tsx` | Fixed bottom dock (cover, title, prev/play-pause/next/stop). **Queue** button opens **[`PlaybackQueueDrawer`](../../src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component.tsx)** with a count badge. Video panel above the bar on mobile; on desktop, a floating panel defaults above the release metadata (left of the transport controls). **[`BottomDrawer`](../../src/components/BottomDrawer/BottomDrawer.component.tsx)** **`aboveMiniPlayer`** sizes the drawer above the dock via inherited CSS vars from **`html:has([data-global-playback-dock])`**. Cover/title calls the registered **`onReleaseClick`** handler when the active page provides one. |
| `PlaybackQueueDrawer.component.tsx` | Bottom drawer listing **`queue`** from **`ReleasePlaybackProvider`**: drag handle reorder (**`reorderQueue`** via `@dnd-kit`), release cover, play at index, remove row, **Clear queue** (**`stopPlayback`**). Uses **[`BottomDrawer`](../../src/components/BottomDrawer/BottomDrawer.component.tsx)** with **`closeButtonPlacement="header"`**, **`behindMiniPlayer`** (drawer slides up from **`bottom: 0`** under the mini-player bar; bar stays on top via z-index; drawer **`padding-bottom`** clears the bar), and overlay **`data-playback-queue-open`** (hides the mobile crate FAB while open). On desktop (≥768px) the panel is right-aligned, max **`31.25rem`** (~500px) wide. |
| `PersistentYoutubeIframe.component.tsx` | YouTube embed iframe (hidden or visible) via **`buildYoutubeEmbedUrl`** (`controls=1`, `fs=1`, `enablejsapi=1`). Registers with **`ReleasePlaybackProvider`**, calls **`notifyPlaybackIframeLoaded`** on **`load`** so [`youtubeIframeEvents.ts`](../../src/utils/youtubeIframeEvents.ts) can subscribe to ended events for queue auto-advance |

Closing **`ReleaseModal`** does not stop playback. **Play in background** or a matched track row click calls **`startPlayback`**, replaces the queue with playable tracks from that album starting at the clicked row, and overwrites whatever is in the dock. Unmatched embeddable videos (deduped by YouTube id) render in **`ReleasePlaybackPreview`** as track-style rows without a position column; row click calls **`startReleasePreview`**, and **Add to queue** calls **`addPreviewToQueue`**. **`findVideoForTrack`** matches on substring overlap or shared title tokens after stripping artist prefixes from video titles. **`getReleasePreviewVideos`** lists embeddable videos not matched to any track. **Add to queue** (list-plus icon on a track row) calls **`addToQueue`** (deduped by **`instanceId` + `trackPosition`**). Prev/next walk the full **`queue`** (cross-release); when a video ends, the provider auto-advances via [`youtubeIframeEvents.ts`](../../src/utils/youtubeIframeEvents.ts). Queue helpers live in [`src/utils/playbackQueue.ts`](../../src/utils/playbackQueue.ts); video matching in [`src/utils/releasePlayback.ts`](../../src/utils/releasePlayback.ts).

Crate, notes, and card filter pill clicks do **not** open the modal. Discogs links live on title, artist, label text, and the cover overlay **View on Discogs** button. On **`/releases`**, **cover art** or the overlay **Release details** button opens the in-app modal; **title** still opens Discogs.

## Feature example: ReleaseNotes

[`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/) follows the standard folder layout plus a colocated state hook:

| File | Role |
|------|------|
| `ReleaseNotes.component.tsx` | **`variant="modal"`** (release modal body): inline **`ReleaseNotesModalEditor`** when editable; read-only stacked **`field-label`** rows. Also **`inline`**, **`table`**, **`crate`** scratchpad, **`displayOnly`** (tests) |
| `ReleaseNotesCardAction.component.tsx` | Sticky-note icon — **`variant="card"`** (image overlay + tooltip) or **`variant="mobile"`** (stacked action column); primary dot badge when notes exist |
| `ReleaseNotesEditor.context.tsx` | Per-card provider so the icon and body share one editor/dialog |
| `ReleaseNotesEditorDialog.component.tsx` | Renders **`NoteEditDialog`** from provider context for **card/mobile overlay** note icon only (not the release modal notes section) |
| `useReleaseNotesEditor.hook.ts` | Dialog state, save handler, optimistic updates |
| `NoteEditDialog.component.tsx` | Release notes editor via **`ScrollModal`** + **`ModalToolbar`** (`data-testid="fmdNoteEditDialog"`); shared **`ReleaseNotesFormFields`** (textarea note fields, then Media/Sleeve Condition **`Select`** dropdowns) |
| `ReleaseNotesFormFields.component.tsx` | Shared note textarea + condition **`Select`** row; all labels compose **`field-label.module.css`** |
| `ReleaseNotesModalEditor.component.tsx` | Inline release-modal notes editor (debounced textarea save, immediate condition saves). Save progress uses **`showReleaseNotesSavingToast`** / **`showReleaseNotesSavedToast`** (Sonner, shared toast id; success auto-dismisses after 2s); inline footer shows errors only |
| `NoteEditDialog.spec.tsx` / `ReleaseNotes.spec.tsx` | Dialog + modal inline editor tests |
| `ReleaseNotes.po.tsx` | Page object (`data-testid="fmdReleaseNotes"`) |

Wrap **`ReleaseCard`** and **`MobileReleaseCard`** with **`ReleaseNotesEditorProvider`**. **`ReleaseNotesCardAction`** (grid overlay / mobile action column) reads **`useReleaseNotesEditorContext()`** to open **`NoteEditDialog`**. Neither card variant renders inline note body copy—do not call **`useReleaseNotesEditor`** twice on the same card.

List/table rows use **`ReleaseNotes`** without the provider; only the **`inline`** subcomponent calls **`useReleaseNotesEditor`** directly.

**`variant="crate"`** (crate detail rows): empty state uses a dashed **Add notes** affordance; filled notes are plain muted body copy with a small underlined **Edit notes** link below.

## Dashboard release rows

Dashboard sections that list releases (On this day, most crated, milestones, duplicates modal list, etc.) share one layout — do not invent per-section cover/title/meta markup or card chrome:

| Piece | Location |
|-------|----------|
| Card shell | [`dashboard-card.module.css`](../../src/styles/modules/dashboard-card.module.css) — **`.releaseRow`** for bordered list rows (composes **`.card`**) |
| Row content | [`DashboardReleaseItem.component.tsx`](../../src/components/Dashboard/DashboardReleaseItem.component.tsx) + [`DashboardReleaseItem.module.css`](../../src/components/Dashboard/DashboardReleaseItem.module.css) |

Section modules may add layout wrappers (grids, year headings, badges) around **`.releaseRow`**, but the inner release presentation stays in **`DashboardReleaseItem`**. See [patterns.md → Dashboard analytics → Card chrome](patterns.md#dashboard-analytics).

## Client page shells

| Shell | Route | Layout |
|-------|-------|--------|
| [`Login`](../../src/components/Login/Login.component.tsx) + [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) | `/`, about, legal, public crate | Server `PageFooter`, optional authenticated header |
| [`ReleasesClient`](../../src/components/ReleasesClient/ReleasesClient.component.tsx) | `/releases` | [`Page`](../../src/components/Page/Page.component.tsx) + [`PlaybackPageShell`](../../src/components/PlaybackPageShell/PlaybackPageShell.component.tsx) + [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) + [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) |
| [`CratesClient`](../../src/components/Crates/CratesClient.component.tsx) / [`CrateHubCard`](../../src/components/Crates/CrateHubCard.component.tsx) / [`CrateDetailClient`](../../src/components/Crates/CrateDetailClient.component.tsx) | `/crates`, `/crates/[id]` | Hub card grid (first-three cover collage) + full-width owner page with [`PlaybackPageShell`](../../src/components/PlaybackPageShell/PlaybackPageShell.component.tsx), [`CrateDetailHeader`](../../src/components/Crates/CrateDetailHeader.component.tsx), shared workspace pieces from [`CrateDrawer/`](../../src/components/CrateDrawer/) ([`CrateReleaseListToolbar`](../../src/components/CrateReleaseListToolbar/CrateReleaseListToolbar.component.tsx), [`CrateSetNotesScratchpad`](../../src/components/CrateSetNotesScratchpad/CrateSetNotesScratchpad.component.tsx)), [`CrateLayoutList`](../../src/components/Crates/CrateLayoutList.component.tsx) (DnD reorder + [`CrateSetMarkerRow`](../../src/components/Crates/CrateSetMarkerRow.component.tsx)), and [`ReleaseModal`](../../src/components/ReleaseModal/ReleaseModal.component.tsx) |
| [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx) | `/dashboard` | [`PlaybackPageShell`](../../src/components/PlaybackPageShell/PlaybackPageShell.component.tsx) + narrative analytics (`DashboardHero`, `DashboardSection`, TanStack Charts) |
| [`SettingsClient`](../../src/components/Settings/SettingsClient.component.tsx) | `/settings` | Sidebar navigation + section panels (account, appearance, filters, collection, data) |
| [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx) | `/mosaic` | Canvas mosaic via [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) |
| [`AdminDashboardClient`](../../src/components/AdminDashboard/AdminDashboardClient.component.tsx) | `/admin` | Admin stats (engagement, account preferences, feature usage, growth); **[`AdminHero`](../../src/components/AdminDashboard/AdminHero.component.tsx)**; **[`AdminUserLookupPanel`](../../src/components/AdminDashboard/AdminUserLookupPanel.component.tsx)** (username lookup + per-account stats); **[`AdminPreferenceBreakdownPanel`](../../src/components/AdminDashboard/AdminPreferenceBreakdownPanel.component.tsx)** (theme/default-view pie + table); ranked tables via **[`AdminMetricTable`](../../src/components/AdminDashboard/AdminMetricTable.component.tsx)** (power users link to Discogs profiles); growth areas via shared [`GrowthAreaChart`](../../src/components/GrowthAreaChart/GrowthAreaChart.component.tsx). Server gate: **[`AdminDashboardGate.server.tsx`](../../src/components/AdminDashboard/AdminDashboardGate.server.tsx)** |
| [`AnalyticsPageViewTracker`](../../src/components/GoogleTagManagerLoader/AnalyticsPageViewTracker.component.tsx) | global (`Providers`) | Consent-gated **`pageView`** events on App Router navigations |

Login marketing assets live under [`public/images/`](../../public/images/) and theme-aware demo components under [`Login/`](../../src/components/Login/).
