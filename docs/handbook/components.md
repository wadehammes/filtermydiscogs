# Components

How UI is organized under `src/components/` and how we test it.

## Folder layout

- **Feature components**: [`src/components/<Name>/`](../../src/components/) — typically:
  - `Name.component.tsx` — main React export (arrow function, typed props)
  - `Name.module.css` — scoped styles
  - Optional `Name.spec.tsx` + `Name.po.tsx` for new tested components (see [conventions.md → Testing](conventions.md#testing))
  - Context/hook/util tests may use `*.test.tsx`; component PO tests use `*.spec.tsx`

- **Shared primitives**: [`src/components/shared/`](../../src/components/shared/) — reusable layout/stats pieces.

- **Providers**: [`src/components/Providers.tsx`](../../src/components/Providers.tsx) — root QueryClient + context stack.

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
