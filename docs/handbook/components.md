# Components

How UI is organized under `src/components/` and how we test it.

## Folder layout

- **Feature components**: [`src/components/<Name>/`](../../src/components/) — typically:
  - `Name.component.tsx` — main React export (arrow function, typed props)
  - `Name.module.css` — scoped styles
  - Optional `Name.spec.tsx` + `Name.po.tsx` for new tested components (see [conventions.md → Testing](conventions.md#testing))
  - Context/hook/util tests may use `*.test.tsx`; component PO tests use `*.spec.tsx`

- **Shared primitives**: [`src/components/shared/`](../../src/components/shared/) — reusable layout/stats pieces.

- **Providers**: [`src/components/Providers.tsx`](../../src/components/Providers.tsx) — root QueryClient + context stack. Global toasts use **[Sonner](https://sonner.emilkowal.ski/)** via [`AppToaster`](../../src/components/AppToaster/AppToaster.component.tsx): **`richColors`**, app token styling in [`sonner.css`](../../src/styles/sonner.css) (maps Sonner CSS variables to **`--card`**, **`--destructive`**, etc. so every palette theme matches), and **`toSonnerTheme`** for Sonner’s light/dark shell. Import **`toast`** from **`sonner`** for user feedback — prefer toasts over **`alert()`** for non-blocking errors and success messages. Auth session feedback on `/` uses [`AuthCheckingToast`](../../src/components/AuthCheckingToast/AuthCheckingToast.component.tsx).
- **Public pages**: [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) is the single client shell for home, about, legal, and public crate pages (`data-testid="fmdPublicAuthLayout"`). Server `page.tsx` files pass [`PageFooter`](../../src/components/Page/PageFooter.server.tsx) as the `footer` prop. [`PublicAuthHeader`](../../src/components/PublicAuthLayout/PublicAuthHeader.component.tsx) renders [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) for visitors or [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) when `authenticatedNavPage` is set and the user is signed in. Props: `currentPage` (`home` \| `about` \| `legal`), `centerMain` (home), `authenticatedNavPage`, optional `header` override, optional `footer`.
- **Landing page**: [`Login`](../../src/components/Login/Login.component.tsx) (`data-testid="fmdLogin"`) composes [`LoginIntro`](../../src/components/LoginIntro/LoginIntro.component.tsx), [`LoginFeatureRow`](../../src/components/LoginFeatureRow/LoginFeatureRow.component.tsx), [`LoginBottomCta`](../../src/components/LoginBottomCta/LoginBottomCta.component.tsx), and shared [`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx). Theme-aware screenshots stay colocated under `Login/` as [`LoginPreviewDemo`](../../src/components/Login/LoginPreviewDemo.component.tsx) and [`LoginFeatureVisual`](../../src/components/Login/LoginFeatureVisual.component.tsx). Feature copy lives in [`loginFeatures.constants.ts`](../../src/components/Login/loginFeatures.constants.ts). [`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx) shows the Discogs SVG with **“Connect with Discogs”** as the accessible name (visible “Discogs” text is `.visuallyHidden` from [`accessibility.module.css`](../../src/styles/accessibility.module.css)). Use it for **every OAuth connect CTA** (landing hero/bottom, public crate “Get Started”, etc.); wire `onClick` to [`useAuth().login`](../../src/context/auth.context.tsx). Public nav **“Log in”** in [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) stays a text link.

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

- Colocate specs with the component when adding coverage (`*.spec.tsx` for PO-backed components; `*.test.tsx` for other tests; optional **`*.po.tsx`**).
- Use **`render`** from **`test-utils`** when auth, filters, or crate context is required **without** mocking (default wrapper is **`TestProviders`**). Context-heavy component tests usually mock context in the PO and use **`render`** instead (see [conventions.md → Testing](conventions.md#testing)).
- **Page composition in POs**: When production mounts a component inside a layout plus server footer (e.g. home = `PublicAuthLayout` + `PageFooter` + `Login`), the PO **`render*`** helper should mirror that tree. Put **`jest.mock("src/components/Page/PageFooter.server")`** in the PO and render `<PageFooter />` in the layout’s `footer` prop—do not inline a partial footer that omits links the spec asserts on.

## Exports

Import from the **concrete module path** (e.g. `src/components/ReleaseCard/ReleaseCard.component.tsx`). Avoid new barrel **`index.ts`** files.

## Feature example: ReleaseCard (desktop grid)

[`ReleaseCard`](../../src/components/ReleaseCard/ReleaseCard.component.tsx) and **`PublicReleaseCard`** share [`ReleaseCard.module.css`](../../src/components/ReleaseCard/ReleaseCard.module.css). Body copy lives in [`ReleaseCardContent`](../../src/components/ReleaseCard/ReleaseCardContent.component.tsx).

| Concern | Pattern |
|---------|---------|
| Shell | **`1px`** border on **`--border`**; **`--shadow-sm`** at rest; hover darkens border to **`--input`** and lifts to **`--shadow-lg`** |
| Highlight | **`.highlighted`** — **`2px`** primary border + **`theme-highlighted-surface`** |
| In crate | **`.inCrate`** — primary **`outline`** on the card shell |

## Feature example: MobileReleaseCard

[`src/components/ReleaseCard/MobileReleaseCard.component.tsx`](../../src/components/ReleaseCard/MobileReleaseCard.component.tsx) is the **mobile** release row (image | content | action column). **`PublicMobileReleaseCard`** shares **`MobileReleaseCard.module.css`**.

| Concern | Pattern |
|---------|---------|
| Shell | **`1px`** border on **`--border`**; **`--shadow-sm`** at rest; hover darkens border to **`--input`** and lifts to **`--shadow-md`** |
| Layout | Horizontal flex: fixed **`7rem`** cover, **`flex: 1 1 0`** content (**`min-width: 0`**), **`4rem`** action column with full-height overlay actions |
| Loading | [`MobileReleaseCardSkeleton`](../../src/components/ReleasesClient/components/MobileReleaseCardSkeleton.component.tsx) mirrors this row layout while collection pages stream in; desktop uses [`DesktopReleaseCardSkeleton`](../../src/components/ReleasesClient/components/DesktopReleaseCardSkeleton.component.tsx) |
| Pills | **`HorizontalScrollRow`** — wrapper needs **`min-width: 0`** + **`overflow: hidden`** so pill rows scroll horizontally instead of wrapping (same component in [`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx)) |
| Title block | Artist + title + meta grouped in **`.releaseInfo`** with **`titleGroupMobile`** / **`metaLineMobile`** / **`catalogRowMobile`** for tight internal spacing; notes and pills keep looser outer gaps |
| Highlight | **`.highlighted`** — **`2px`** primary border + **`theme-highlighted-surface`** |
| In crate | **`.inCrate::after`** draws a full-card primary ring on top of artwork (do not use inset **`box-shadow`**—cover art hides the left edge) |
| Notes action | **`ReleaseNotesCardAction variant="mobile"`** — stacked column button styles; desktop overlay uses default **`variant="card"`** |
| Open detail modal | Cover art or **Release details** overlay button call optional **`onReleaseClick`**; title links to Discogs in a new tab |
| Overlay actions | **`ReleaseCardOverlayActions`**: release details (menu icon), View on Discogs (external link), notes, crate — desktop segmented row on cover; mobile full-height column with **`border-top`** separators (no inner frame) |

## Feature example: ReleasesTable

[`ReleasesTable`](../../src/components/ReleasesTable/ReleasesTable.component.tsx) is the desktop **list** view on **`/releases`** when view mode is list (see [architecture.md](architecture.md) → view atoms). TanStack Table renders checkbox, cover, artist/title, label, year, **Format/Styles**, and notes columns.

| Concern | Pattern |
|---------|---------|
| Format/Styles column | Format pills plus genre/style tags from [`getReleaseGenreStyleTags`](../../src/utils/releaseGenreStyleTags.ts), wrapped in **`HorizontalScrollRow`** inside a fixed-width cell (**`min-width: 0`**) so tags scroll horizontally instead of wrapping |
| Filter pills | Same **`usePillClickHandler`** / **`useFilterAtoms`** wiring as release cards — pills toggle format and genre/style filters |
| Notes | **`ReleaseNotes variant="table"`** — no per-row **`ReleaseNotesEditorProvider`** (see ReleaseNotes feature example) |

## Feature example: ReleaseModal

[`src/components/ReleaseModal/`](../../src/components/ReleaseModal/) is the release detail dialog on **`/releases`**. Opened when the user clicks cover art or title on a collection card (via **`onReleaseClick`** from [`useReleasesClient`](../../src/hooks/useReleasesClient.hook.ts)).

| File | Role |
|------|------|
| `ReleaseModal.component.tsx` | Backdrop, hero header (cover, metadata, crate/Discogs/close), scrollable body, analytics on open |
| `ReleaseModalBody.component.tsx` | Tracklist via **`useReleaseModalPlayback`**, then notes at the bottom |
| `ReleaseSummaryHero.component.tsx` | Top toolbar (crate, Discogs, close) + stacked cover/metadata on mobile, side-by-side on desktop; clickable format/style filter pills |
| `PublicReleaseModal.component.tsx` | Public crate variant — same shell/styles, **`PublicReleaseSummaryHero`** + **`PublicReleaseModalBody`** (tracklist only) |
| `PublicReleaseSummaryHero.component.tsx` | Discogs + close toolbar; static format/style pills (no filter actions, no crate toggle) |
| `PublicReleaseModalBody.component.tsx` | Tracklist/playback only — no notes section |
| `ReleasePlaybackFallback.component.tsx` | YouTube search + external video links when no embeddable video is available |
| `ReleaseTracklist.component.tsx` | Clickable track rows with optional per-track **`artists`** / **`extraartists`** credits (shown on Various Artists comps and when credits differ from the release artist); click starts background playback; click the active dock track again to play/pause; animated bars or pause icon on the dock’s active track |
| `useReleaseModalPlayback.hook.ts` | Modal playback state; track select calls **`startPlayback`** |

## Feature example: ReleasePlayback

[`src/components/ReleasePlayback/`](../../src/components/ReleasePlayback/) hosts the persistent background player on **`/releases`** and public **`/crate/[id]`** pages. [`ReleasePlaybackProvider`](../../src/context/releasePlayback.context.tsx) wraps **`ReleasesClient`** and **`PublicCrateClient`** (not global **`Providers`**).

| File | Role |
|------|------|
| `ReleaseMiniPlayer.component.tsx` | Video panel above the video toggle in the transport cluster. **Desktop:** crate +/- left of cover/title, then transport controls. **Mobile:** centered cover/title on the top row; transport row is crate, video, prev/play/next, stop (centered, `2.5rem` controls, `var(--space-2)` gap). [`ReleasePlaybackVideoPanel`](../../src/components/ReleasePlayback/ReleasePlaybackVideoPanel.component.tsx) is full viewport width on mobile; bar height tokens on `.withMiniPlayer` offset page padding, the mobile crate FAB, Back to top, and the crate drawer (mobile bottom drawer **`bottom`**, desktop sidebar height). When the mobile video panel is expanded, `.withMiniPlayer:has([data-video-expanded])` adds `--release-mini-player-video-panel-offset` so the crate FAB and Back to top sit above the 16:9 panel (FAB z-index drops below the panel). |
| `PersistentYoutubeIframe.component.tsx` | Off-screen iframe that carries actual playback audio/video |

Closing **`ReleaseModal`** does not stop playback. **Play in background** or a track row click calls **`startPlayback`** and overwrites whatever is in the dock. Prev/next walk the flattened tracklist for the active release (v1 album queue). Helpers live in [`src/utils/releasePlayback.ts`](../../src/utils/releasePlayback.ts).

Crate, notes, and card filter pill clicks do **not** open the modal. Discogs links live on title, artist, label text, and the cover overlay **View on Discogs** button. On **`/releases`**, **cover art** or the overlay **Release details** button opens the in-app modal; **title** still opens Discogs.

## Feature example: ReleaseNotes

[`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/) follows the standard folder layout plus a colocated state hook:

| File | Role |
|------|------|
| `ReleaseNotes.component.tsx` | Card display (`variant="displayOnly"`), list display (`inline`), release modal (`variant="modal"`) |
| `ReleaseNotesCardAction.component.tsx` | Sticky-note icon — **`variant="card"`** (image overlay + tooltip) or **`variant="mobile"`** (stacked action column); no active styling when notes exist |
| `ReleaseNotesEditor.context.tsx` | Per-card provider so the icon and body share one editor/dialog |
| `useReleaseNotesEditor.hook.ts` | Dialog state, save handler, optimistic updates |
| `NoteEditDialog.component.tsx` | Native `<dialog>` editor (`data-testid="fmdNoteEditDialog"`) |
| `ReleaseNotes.po.tsx` / `ReleaseNotes.spec.tsx` | Page object + tests (`data-testid="fmdReleaseNotes"`) |

Wrap **`ReleaseCard`** and **`MobileReleaseCard`** with **`ReleaseNotesEditorProvider`**. **`ReleaseNotesCardAction`** and card **`ReleaseNotes`** (`displayOnly`) must consume **`useReleaseNotesEditorContext`**—do not call **`useReleaseNotesEditor`** twice on the same card.

List/table rows use **`ReleaseNotes`** without the provider; only the **`inline`** subcomponent calls **`useReleaseNotesEditor`** directly.

## Client page shells

| Shell | Route | Layout |
|-------|-------|--------|
| [`Login`](../../src/components/Login/Login.component.tsx) + [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) | `/`, about, legal, public crate | Server `PageFooter`, optional authenticated header |
| [`ReleasesClient`](../../src/components/ReleasesClient/ReleasesClient.component.tsx) | `/releases` | [`Page`](../../src/components/Page/Page.component.tsx) + [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) + [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) |
| [`DashboardClient`](../../src/components/Dashboard/DashboardClient.component.tsx) | `/dashboard` | Analytics charts (Recharts) |
| [`SettingsClient`](../../src/components/Settings/SettingsClient.component.tsx) | `/settings` | Sidebar navigation + section panels (account, appearance, filters, collection, data) |
| [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx) | `/mosaic` | Canvas mosaic via [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) |
| [`AdminDashboardClient`](../../src/components/AdminDashboard/AdminDashboardClient.component.tsx) | `/admin` | Admin stats |

Login marketing assets live under [`public/images/`](../../public/images/) and theme-aware demo components under [`Login/`](../../src/components/Login/).
