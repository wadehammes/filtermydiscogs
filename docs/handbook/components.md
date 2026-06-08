# Components

How UI is organized under `src/components/` and how we test it.

## Folder layout

- **Feature components**: [`src/components/<Name>/`](../../src/components/) — typically:
  - `Name.component.tsx` — main React export (arrow function, typed props)
  - `Name.module.css` — scoped styles
  - Optional `Name.spec.tsx` + `Name.po.tsx` for new tested components (see [conventions.md → Testing](conventions.md#testing))
  - Context/hook/util tests may use `*.test.tsx`; component PO tests use `*.spec.tsx`

- **Shared primitives**: [`src/components/shared/`](../../src/components/shared/) — reusable layout/stats pieces.

- **Providers**: [`src/components/Providers.tsx`](../../src/components/Providers.tsx) — root QueryClient + context stack. Global toasts use **[Sonner](https://sonner.emilkowal.ski/)** via [`AppToaster`](../../src/components/AppToaster/AppToaster.component.tsx); auth session feedback on `/` uses [`AuthCheckingToast`](../../src/components/AuthCheckingToast/AuthCheckingToast.component.tsx).
- **Public pages**: [`PublicAuthLayout`](../../src/components/PublicAuthLayout/PublicAuthLayout.component.tsx) is the single client shell for home, about, legal, and public crate pages (`data-testid="fmdPublicAuthLayout"`). Server `page.tsx` files pass [`PageFooter`](../../src/components/Page/PageFooter.server.tsx) as the `footer` prop. [`PublicAuthHeader`](../../src/components/PublicAuthLayout/PublicAuthHeader.component.tsx) renders [`PublicPageHeader`](../../src/components/PublicPageHeader/PublicPageHeader.component.tsx) for visitors or [`StickyHeaderBar`](../../src/components/StickyHeaderBar/StickyHeaderBar.component.tsx) when `authenticatedNavPage` is set and the user is signed in. Props: `currentPage` (`home` \| `about` \| `legal`), `centerMain` (home), `authenticatedNavPage`, optional `header` override, optional `footer`.
- **Landing page**: [`Login`](../../src/components/Login/Login.component.tsx) (`data-testid="fmdLogin"`) composes [`LoginIntro`](../../src/components/LoginIntro/LoginIntro.component.tsx), [`LoginFeatureRow`](../../src/components/LoginFeatureRow/LoginFeatureRow.component.tsx), [`LoginBottomCta`](../../src/components/LoginBottomCta/LoginBottomCta.component.tsx), and shared [`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx). Theme-aware screenshots stay colocated under `Login/` as [`LoginPreviewDemo`](../../src/components/Login/LoginPreviewDemo.component.tsx) and [`LoginFeatureVisual`](../../src/components/Login/LoginFeatureVisual.component.tsx). Feature copy lives in [`loginFeatures.constants.ts`](../../src/components/Login/loginFeatures.constants.ts). [`LoginConnectButton`](../../src/components/LoginConnectButton/LoginConnectButton.component.tsx) shows the Discogs SVG with **“Connect with Discogs”** as the accessible name (visible “Discogs” text is `.visuallyHidden` from [`accessibility.module.css`](../../src/styles/accessibility.module.css)).

## Naming

- Prefer **`.component.tsx`** for the main React export in a feature folder.
- **Client page shells** use **`*Client.tsx`** or **`*Client.component.tsx`** imported from a server `page.tsx`.
- Keep **one primary component file** per folder unless the feature is large enough to justify split files (hooks, subcomponents).

## CSS Modules

Import as `import styles from "./Name.module.css"` and reference **`styles.className`**. Prefer **`classNames`** with object notation for conditionals (see [conventions.md](conventions.md)).

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

## Feature example: MobileReleaseCard

[`src/components/ReleaseCard/MobileReleaseCard.component.tsx`](../../src/components/ReleaseCard/MobileReleaseCard.component.tsx) is the **mobile** release row (image | content | action column). **`PublicMobileReleaseCard`** shares **`MobileReleaseCard.module.css`**.

| Concern | Pattern |
|---------|---------|
| Layout | Horizontal flex: fixed **`6rem`** cover, **`flex: 1 1 0`** content (**`min-width: 0`**), **`3rem`** action column with **`.actionSlot`** children (**`flex: 1 1 0`**) for equal-height icon buttons |
| Pills | **`HorizontalScrollRow`** — wrapper needs **`min-width: 0`** + **`overflow: hidden`** so pill rows do not expand card width |
| Title block | Artist + title + meta grouped in **`.releaseInfo`** with **`titleGroupMobile`** / **`metaLineMobile`** / **`catalogRowMobile`** for tight internal spacing; notes and pills keep looser outer gaps |
| In crate | **`.inCrate::after`** draws a full-card primary ring on top of artwork (do not use inset **`box-shadow`**—cover art hides the left edge) |
| Notes action | **`ReleaseNotesCardAction variant="mobile"`** — stacked column button styles; desktop overlay uses default **`variant="card"`** |

## Feature example: ReleaseNotes

[`src/components/ReleaseNotes/`](../../src/components/ReleaseNotes/) follows the standard folder layout plus a colocated state hook:

| File | Role |
|------|------|
| `ReleaseNotes.component.tsx` | Card display (`variant="displayOnly"`) and list display (`inline`) |
| `ReleaseNotesCardAction.component.tsx` | Sticky-note icon — **`variant="card"`** (image overlay + tooltip) or **`variant="mobile"`** (stacked action column) |
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
| [`MosaicClient`](../../src/components/MosaicClient/MosaicClient.component.tsx) | `/mosaic` | Canvas mosaic via [`MosaicClientWrapper`](../../src/components/MosaicClient/MosaicClientWrapper.component.tsx) |
| [`AdminDashboardClient`](../../src/components/AdminDashboard/AdminDashboardClient.component.tsx) | `/admin` | Admin stats |

Login marketing assets live under [`public/images/`](../../public/images/) and theme-aware demo components under [`Login/`](../../src/components/Login/).
