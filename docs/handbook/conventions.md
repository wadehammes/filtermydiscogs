# Conventions

House style for TypeScript, React, CSS, and tests so the repo reads consistently. When something here conflicts with a local shortcut, follow the doc (or open a PR to change the doc if the rule is wrong).

If you are unsure, copy a nearby file that already does the right thing and run **`pnpm lint`** and **`pnpm tsc:ci`** before you push.

## TypeScript

- **Blank line after declarations.** After `const` / `let` declarations in a function or block, leave one blank line before the next statement when that statement is control flow (`if`, `for`, `while`, `switch`, `try`) or a `return` (or other logic that is not another declaration). Do not insert a blank line between consecutive declarations that form one setup block.

```ts
const username = searchParams.get("username");

if (!username) {
  return NextResponse.json({ error: "Username is required" }, { status: 400 });
}
```

- **Use arrow functions always.** Prefer `const fn = () => {}` over `function fn() {}` for components and helpers. **Exception:** Next.js route handlers and some `page.tsx` / `layout.tsx` exports may use `export async function GET` or `export default function Page` where the framework expects it.
- **If blocks always use `{}`.** Same for `else`, `for`, `while`, and `do`—never omit braces for single-line bodies.
- **Never use `any`.** Use proper types for props, state, and function signatures.
- **Components**: Use arrow functions where you control the export (e.g. `export const MyComponent = (props: Props) => { ... }`). Do not use `React.FC` / `FC` in new code; prefer typed props on arrow components. When editing older context files that still use `FC`, match the surrounding file unless you are refactoring that module.
- **Never use non-null assertion (`!`).** Use optional chaining, nullish coalescing (`??`), or explicit checks instead.
- **Omit redundant return types** when the compiler can infer them. Add return types only for public API clarity or when inference would be wrong or unclear.
- **No nested ternaries.** Use `if`/`else` or extract to a variable or helper. A single ternary is fine; nesting is not.
- **No barrel files.** Do not add `index.ts` (or `index.tsx`) that re-export from other modules under `src/`. Import directly from the target file (e.g. `from "src/components/ReleaseCard/ReleaseCard.component"`).
- **Absolute imports (`src/…`).** Import application TS/TSX with paths rooted at `src/`. Do not use `../` across `src/` boundaries unless an exception below applies.
- **Exceptions to absolute imports:** (1) **CSS Modules** and static assets co-located with the importer (e.g. `import styles from "./MyComponent.module.css"`). (2) **Factory imports** within `src/tests/factories/` may use relative imports to sibling factories.
- **Do not re-export types (or values) from another module** just to shorten import paths. Consumers import from the defining module. Do not re-export types from a component file; use `src/types/` or a colocated `*.types.ts` if needed.
- **Single params object** for helpers, hooks, and any function with more than one argument or optional arguments (e.g. `useDiscogsCollectionQuery({ username, enabled })`, `getResourceUrl({ resourceUrl, type })`) so call sites are self-documenting. Define an interface for params in the same file when it helps.
- **Semantic parameter and variable names.** Describe what the value *is*, not generic placeholders like `raw`, `data`, `val`, `tmp`.
- **App-level types**: Shared types live under [`src/types/`](../../src/types/) (e.g. [`index.ts`](../../src/types/index.ts), [`crate.types.ts`](../../src/types/crate.types.ts)). Type-only modules belong here, not under `src/utils/`.
- **API payloads**: Define request/response types next to the feature or under `src/types/` when shared.
- **Constants**: App-wide literals live in [`src/constants.ts`](../../src/constants.ts) and topic modules under [`src/constants/`](../../src/constants/) (e.g. [`sorting.ts`](../../src/constants/sorting.ts)). Use `src/utils/` for functions.
- **Discogs usernames**: Validate with **`isValidDiscogsUsername`** from [`src/lib/discogs-username.ts`](../../src/lib/discogs-username.ts) in route handlers—do not duplicate ad-hoc regex (see [discogs.md](discogs.md)).
- **`exactOptionalPropertyTypes`** (`tsconfig.json`): Optional props (`foo?: T`) may be **omitted** or set to `T`—never pass **`undefined`** explicitly.
  - **`className`**: Pass CSS module tokens through **`classNames()`** (returns `string`; accepts `string | undefined`).
  - **Other optional props**: Spread **`definedProps({ ... })`** from [`src/utils/definedProps.ts`](../../src/utils/definedProps.ts) to drop `undefined` keys before spread.
  - **Do not** build props with sequential `if (value !== undefined) { props.key = value }` blocks, or conditional spreads like `{...(styles.foo ? { className: styles.foo } : {})}`.

```tsx
<ViewToggle
  currentView={currentView}
  onViewChange={onViewChange}
  className={classNames(styles.viewToggleMobile)}
  {...definedProps({ onCratesClick, isCratesOpen })}
/>

<CrateSelector className={classNames(styles.headerCrateSelector)} />
```

## React / JSX

Plain functions with typed props—no `React.FC` in new code—and explicit conditionals so we never accidentally render a stray `0` or `false`.

- **Conditional components**: Use a ternary (`condition ? <Component /> : null`) instead of short-circuit (`condition && <Component />`) when the condition could render a falsy value (e.g. `0`). Write multi-line ternaries—each branch on its own line(s).
- **Multiple or conditional class names**: Use **`classnames`** (import as `classNames`) whenever a `className` combines more than one token or depends on state. Do **not** use template literals, string concatenation, or inline ternaries (`condition ? styles.a : ""`) on `className`.
  - **Static lists**: `classNames(styles.a, styles.b)`
  - **Conditionals**: prefer **object notation** — `classNames(styles.base, { [styles.active]: isActive })`
  - **Optional `className` prop**: `classNames(styles.container, className)` — `classNames` ignores `undefined`
  - **Single module class, no conditionals**: `className={styles.block}` is fine without `classNames`
  - **No `as string` casts** on CSS module keys in object notation — [`cssprops.d.ts`](../../cssprops.d.ts) types `*.module.css` imports so `{ [styles.active]: isActive }` works under `noUncheckedIndexedAccess` without `[styles.active as string]`
- **Raster images**: Use **`next/image`**. Avoid bare **`<img>`** except rare documented exceptions. Every **`Image`** needs **`alt`**. Discogs covers use **`i.discogs.com`** (allowlisted in `next.config.ts`).
- **Links**: Use **`next/link`**’s **`Link`** for navigational links—internal paths and external URLs—not a bare **`<a>`** unless you have a rare, documented exception. For new tabs, set **`target`** and **`rel="noopener noreferrer"`**.
- **Context + reducer** for cross-page UI state with side effects (auth session, collection pagination); **Jotai** for high-churn derived client state (filters, view); **React Query** for server-backed data (see [patterns.md](patterns.md)).
- **Forms**: Use **[React Hook Form](https://react-hook-form.com/)** (`useForm`, `register`, `handleSubmit`) for submit-style forms (create/edit dialogs, multi-field modals). Reset with `reset()` when a dialog opens or defaults change. Live filter/search inputs that dispatch on every keystroke (e.g. [`SearchBar`](../../src/components/SearchBar/SearchBar.component.tsx), autocomplete dropdown search) may stay controlled without RHF.

### Large components and state

- **Extract state into a custom hook** when a component accumulates several `useState` / `useEffect` calls and derived values. Colocate **`useMyFeatureState.ts`** (or similar) in the component folder; return one object of state and handlers; keep the `.component.tsx` file focused on composition and JSX.

## Formatting and linting

**Biome** is the single source for JS/TS lint and format. **Stylelint** covers CSS.

- **Braces**: Always `{}` for control flow, including single-line bodies. No `if (!x) return null` on one line—use a block.
- **Commands**:
  - `pnpm lint` — Biome check
  - `pnpm lint:fix` — `biome check --fix`
  - `pnpm lint:check` — Biome on changed files since `origin/main`
  - `pnpm lint:css` / `pnpm lint:css:fix` — Stylelint over `src/**/*.css`
  - `pnpm lint:all` — `lint:check` then `lint:css:fix`
  - `pnpm tsc:ci` — `db:generate` then strict TypeScript (`tsc --strict`)
- **Configs**: [`biome.json`](../../biome.json), [`stylelint.config.mjs`](../../stylelint.config.mjs).
- **CI**: `pnpm lint:ci`, `pnpm lint:css`, `pnpm test:ci`, `pnpm knip:ci` (see [platform.md](platform.md)).

## CSS and styling

### Technology

- **CSS Modules** (`.module.css`) co-located with the component.

### File naming

- **`MyComponent.component.tsx`** + **`MyComponent.module.css`**. Use the `styles.*` object in TSX.
- **Shared style modules** under [`src/styles/`](../../src/styles/) (e.g. [`nav-links.module.css`](../../src/styles/nav-links.module.css), [`segmented-control.module.css`](../../src/styles/segmented-control.module.css), [`dashboard-card.module.css`](../../src/styles/dashboard-card.module.css), [`playback-dock.module.css`](../../src/styles/playback-dock.module.css), [`modal-input.module.css`](../../src/styles/modal-input.module.css), [`modal-dialog.module.css`](../../src/styles/modal-dialog.module.css), [`field-label.module.css`](../../src/styles/field-label.module.css), [`scratchpad-textarea.module.css`](../../src/styles/scratchpad-textarea.module.css)) for cross-component patterns. Import directly from the module path; do not re-export through barrel files. Dashboard bordered panels and release rows compose **[`dashboard-card.module.css`](../../src/styles/dashboard-card.module.css)** — see [patterns.md → Dashboard analytics → Card chrome](patterns.md#dashboard-analytics).
- **Modal / dialog inputs** (`input`, `textarea`, `select` in dialogs, bottom drawers, and edit modals): use **`16px`** font size via [`modal-input.module.css`](../../src/styles/modal-input.module.css) (`.field`) — not `rem` tokens — so iOS Safari does not zoom on focus when root `html` font-size scales below 16px.
- **Mobile filter controls** ([`SearchBar`](../../src/components/SearchBar/SearchBar.module.css), [`Select`](../../src/components/Select/Select.module.css), [`AutocompleteSelect`](../../src/components/AutocompleteSelect/AutocompleteSelect.module.css)): below **`768px`**, align tap targets with **`min-height: var(--touch-target-min)`**, **`1rem`** type, and **`var(--space-3) var(--space-4)`** padding; at **`768px+`** use **`var(--input-height)`** and compact padding. Portaled dropdown **`.option`** rows use **`min-height: 3rem`** and **`var(--space-4)`** padding on mobile for easier tapping. **[`Select`](../../src/components/Select/Select.component.tsx)** uses **Base UI** [`@base-ui/react/select`](https://base-ui.com/react/components/select) (`Select.Root` / `Trigger` / `Portal` / `Positioner` / `Popup` / `List` / `Item`) with existing CSS Modules; trigger role is **`combobox`** (not **`button`**). **[`AutocompleteSelect`](../../src/components/AutocompleteSelect/AutocompleteSelect.component.tsx)** uses **Base UI** [`@base-ui/react/combobox`](https://base-ui.com/react/components/combobox) with the **input inside popup** pattern (`Combobox.Input` in `Popup` for search). Single-select: full **`Combobox.Trigger`** shows the value + chevron. Multi-select: when empty, full trigger shows placeholder + chevron; when selected, **`.triggerShell`** wraps selection pills plus a chevron-only **`.triggerActivator`** **`Combobox.Trigger`** — pill remove controls are **`<button type="button">`** siblings of the trigger (never nested inside **`Combobox.Trigger`**, which is already a **`<button>`**). Both filter controls share [`getFilterControlledValue`](../../src/utils/filterControlValue.ts) / [`applyFilterValueChange`](../../src/utils/filterControlValue.ts) and [`useFilterControlPositionerZIndex`](../../src/hooks/useFilterControlPositionerZIndex.hook.ts). Both use **`modal={false}`**, context z-index in **`FiltersBar`** / **`FiltersDrawer`**, and **`[data-popup-open]`** / **`[data-highlighted]`** / **`[data-selected]`** on trigger and options. In **`FiltersDrawer`**, pass **`showLabel`** so each control renders a visible label via [`field-label.module.css`](../../src/styles/field-label.module.css) (uppercase, muted, **`--text-xxs`**).
- **Modal / dialog layout** (controlled overlays such as **`ConfirmDialog`**, **`ScrollModal`**, **`NoteEditDialog`**, **`EditCrateDialog`**): portaled dialogs use **[Base UI](https://base-ui.com/react/overview/quick-start)** via **[`AppDialog`](../../src/components/shared/AppDialog/AppDialog.component.tsx)** — **`Dialog.Root`** + **`Dialog.Portal`** / **`Dialog.Backdrop`** / **`Dialog.Popup`**, styled with [`base-ui-portal.module.css`](../../src/styles/base-ui-portal.module.css) and [`modal-dialog.module.css`](../../src/styles/modal-dialog.module.css). **`.shell`** is the shared **`1px`** panel chrome (background, border, radius) plus **`--shadow-modal`**. Compose **`AppDialog`** with **`Dialog.Title`** / **`Dialog.Description`** for labelled content; pass **`backdropVariant="modal"`** for crate/note editors and release modals. Tests: popup **`data-testid`** is the dialog root; backdrop dismiss uses **`${testId}-backdrop`**. Scrollable card modals use **`ScrollModal`** with one outer **`.shell`** border; **`.header`** gets a single **`border-bottom`** divider (not per-row borders on **[`ModalToolbar`](../../src/components/shared/ModalToolbar/ModalToolbar.component.tsx)** or subheaders). Release heroes pass crate/Discogs actions in the toolbar; duplicates modal passes **`title`** plus description text below the toolbar. Filter dropdowns (**`Select`**, **`AutocompleteSelect`**) use Base UI **`Positioner`** / **`Portal`** with context z-index. Header/crate action menus use Base UI **`Menu`** (`Menu.Root` / `Trigger` / `Portal` / `Positioner` / `Popup` / `Item` / `LinkItem` / `Separator`) with **`modal={false}`** and **`[data-highlighted]`** on items.

### Component block structure

Each **`.module.css`** file is organized around **block classes** (the `styles.*` keys used in TSX). Follow this structure:

1. **One block class per UI surface** (`.releaseCard`, `.header`, `.crateFab`) as a top-level rule.
2. **Always nest inside the block**:
   - States and pseudo-classes: `&:hover`, `&:focus-visible`, `&.active`, `&.inCrate`
   - **`@media` that changes this block** — inside the rule it affects, never grouped at file bottom
   - Parent-context overrides: `.withSidebar &` when the block reacts to an ancestor state
   - Multiple child rules under the same block — group them inside `.block { }` so the relationship is obvious
3. **Flat descendants are fine for simple cases** — a lone **`.block h2`** or **`.block p`** at the top level is OK when it is the **only** rule for that element under that block (no sibling child rules, no modifiers on the same selector). Nesting is optional here, not required.

```css
/* ✅ Either form is fine for a single heading rule */
.errorContainer h2 {
  color: var(--destructive);
}

.errorContainer {
  h2 {
    color: var(--destructive);
  }
}
```

4. **Max nesting depth: three levels** (block → child/state → pseudo). If deeper, split into a new top-level block class.
5. **Forbidden patterns**:
   - Top-level `@media` blocks that retarget multiple unrelated classes — nest per block instead
   - Repeating `.blockName` instead of `&` (`.button { .button:hover { } }` → `.button { &:hover { } }`)
   - Long compound chains at the top level (`.block .child .grandchild`) — nest or split into block classes

**Reference implementations:** [`Button.module.css`](../../src/components/Button/Button.module.css) (modifiers + `&`), [`MosaicClient.module.css`](../../src/components/MosaicClient/MosaicClient.module.css) (nested elements + `@media`).

### Mobile-first breakpoints

- **Default styles = smallest viewport.** Enhance with range queries: **`@media (width >= 768px)`**, **`@media (width >= 1024px)`** (Stylelint enforces this notation over legacy `min-width:`).
- **Do not** use `@media (max-width: …)` or `@media (width <= …)` in new or edited rules.
- **Standard breakpoints** (match existing layout hooks): **`768px`** (mobile → tablet), **`1024px`** (tablet → desktop). Use `620px` only where the releases grid already does.
- When desktop is the simpler case, still start mobile-first: put mobile values in the default block, add desktop overrides in `@media (min-width: …)`.

```css
/* ✅ Mobile-first */
.crateFab {
  display: flex;

  @media (width >= 1024px) {
    display: none;
  }
}

/* ❌ Desktop-first */
.crateFab {
  display: none;

  @media (width <= 1023px) {
    display: flex;
  }
}
```

### Modern CSS

- **Custom properties**: Use theme tokens from [`src/styles/themes/`](../../src/styles/themes/) and [`src/styles/global.css`](../../src/styles/global.css)—not magic numbers.
- **Theme files** ([`src/styles/themes/`](../../src/styles/themes/)):
  - **`base.css`** — spacing, typography, transitions, z-index, pattern tokens (`--pattern-microdot`, `--pattern-microdot-size`), component sizing (`--input-height`, **`--touch-target-min`** for 44px mobile tap targets).
  - **[`patterns.module.css`](../../src/styles/patterns.module.css)** — composable **`microdotbackground`** and **`microdotoverlay`** (`::before`) helpers that consume those tokens.
  - **`colors.css`** — semantic colors via **`light-dark()`** and **`color-scheme`**; **`--on-primary`**, **`--on-success`**, etc. for filled surfaces.
  - **`primary.css`** — per-theme **`--primary*`** overrides and shared **`contrast-color()`** **`--on-primary*`** for non-default primaries.
  - **`palette-derivations.css`** — derives surface tokens (**`--foreground`**, **`--card`**, **`--muted`**, borders, shadows, gray scale) from each palette’s **`--background`** using **`contrast-color()`** and **`color-mix()`**; loaded after individual palette files in **`index.css`**.
  - Individual palette files (**`dim.css`**, **`sepia.css`**, etc.) — anchor **`--background`**, theme-specific gradients/pills, and exceptions only.
  - **`theming.css`** — global utility classes (`.theme-surface-elevated`, `.theme-highlighted-surface`, `.theme-gradient-surface`, `.theme-on-gradient-muted`).
  - **`index.css`** — imports the files above; loaded from [`global.css`](../../src/styles/global.css).
- **Theming**: Semantic colors live in [`colors.css`](../../src/styles/themes/colors.css) (`:root` defaults including **`--primary: #06c`**) and resolve with **`light-dark()`** from **`color-scheme`**. Hover/active states and shadows use **`color-mix()`**; destructive/success/warning label colors use **`contrast-color()`**. Per-theme primary/link overrides that differ from the default live in [`primary.css`](../../src/styles/themes/primary.css) (**`light`** and **`dark`** use default **`#06c`** from [`colors.css`](../../src/styles/themes/colors.css); **`dim`** steel blue `#3a5a75`; **`sepia`** umber `#7a5534`; **`slate`** `#456b8a`; **`midnight`** `#6ba3e8`; **`futuristic`** `#3db8c4`; **`high-contrast`** `#6eb5ff`). Custom palettes set **`--background`**, theme-local **`--gradientPink`** / **`--gradientTeal`** (so footer/marketing gradients harmonize instead of inheriting the neon light/dark stops), pills, and gradient surfaces in [`dim.css`](../../src/styles/themes/dim.css) (light cool gray with soft surface contrast), [`sepia.css`](../../src/styles/themes/sepia.css) (warm parchment), [`slate.css`](../../src/styles/themes/slate.css) (coastal blue-gray), [`midnight.css`](../../src/styles/themes/midnight.css) (deep indigo), [`futuristic.css`](../../src/styles/themes/futuristic.css) (muted studio glow), and [`high-contrast.css`](../../src/styles/themes/high-contrast.css); shared surface tokens and per-palette **destructive/success/warning** tuning (for contrast on derived **`--card`** surfaces) live in [`palette-derivations.css`](../../src/styles/themes/palette-derivations.css). The theme provider sets **`data-theme`** on `<html>` to the resolved palette; **`system`** stores the user preference but applies **`light`** or **`dark`** from the OS. Labels, cycle order, **`themeUsesDarkAssets`**, and **`toSonnerTheme`** (maps any palette to Sonner’s **`light`** / **`dark`**) live in [`themeAppearance.ts`](../../src/utils/themeAppearance.ts).
- **Filled buttons and pills**: Default/hover/active text on solid semantic backgrounds uses **`--primary-foreground`** / **`--on-primary-hover`** / **`--on-primary-active`** (and the matching **`--on-success*`**, **`--on-destructive*`**, **`--on-warning*`** tokens). Set **`background`**, **`border-color`**, and **`color`** together on **`:hover`** and **`:active`** — never apply **`--on-*`** text without a matching solid or tint fill (outline **`Button`** **`danger`** fills on hover; tinted error banners use **`--destructive`** text, not **`--on-destructive*`**). Pin **`--on-primary*`** to **`#fff`** for brand blue where **`contrast-color()`** would pick black; use **`contrast-color()`** for other semantic fills and dynamic surfaces (e.g. **`--on-gradient-surface`**, palette-derived **`--foreground`**).
- **Outlined success UI** (`.pillStyle` in [`pills.css`](../../src/styles/pills.css), **`Button`** **`success`** variant, crate selector **New Crate** button): default state uses **`--pill-style-foreground`** / **`--pill-style-border`** (lighter hues in dark mode for WCAG AA on the 15% tint). Hover/active use solid **`--success*`** fills with **`--on-*`** text. **`Button`** **`danger`** variant (outline default, solid **`--destructive*`** fill on hover/active with **`--on-destructive*`** text) follows the same pattern. **Format pills** use **`--pill-format-*`** the same way with **`--warning*`** on interaction.
- **Legacy scale tokens** (**`--primary-500`**, **`--success-500`**, **`--error-500`**, etc.) alias the semantic tokens in **`colors.css`**—do not reintroduce brighter one-off hex values there.
- **Shared elevation / micro-theming**: Prefer global utilities from [`theming.css`](../../src/styles/theming.css) over copy-pasted shadow stacks. In a CSS Module:

```css
.releaseItem {
  --surface: var(--card);

  composes: theme-surface-elevated from global;
}

.releaseCard {
  &.highlighted {
    composes: theme-highlighted-surface from global;
  }
}
```

  Set **`--surface`** when the utility needs a non-default surface. **`composes`** must be on a **top-level** local class (e.g. `.highlighted`), not nested under **`&`**—Turbopack/CSS Modules reject **`&.foo { composes: … }`**. Gradient marketing/footer shells compose **`theme-gradient-surface`**; muted text inside them uses **`theme-on-gradient-muted`** (apply via a local class that **`composes`**, or **`classNames`** in TSX—see [`Page.module.css`](../../src/components/Page/Page.module.css)).
- **Layout**: Prefer **flex/grid** with **`gap`** over margin stacking.
- **Color**: Use **`color-mix(in srgb, …)`** for tinted surfaces (see [`BackToTop.module.css`](../../src/components/BackToTop/BackToTop.module.css)).
- **Fluid sizing**: Use **`clamp()`** for type and spacing that scales across viewports (see [`MosaicClient.module.css`](../../src/components/MosaicClient/MosaicClient.module.css)).

### Style rules

- **Alphabetize** properties within each rule block.
- **Selector order**: Base class rules **before** more specific compounds so Stylelint **`no-descending-specificity`** passes (define `.artistLine` before nesting under `.titleGroupMobile`).
- **Spacing**: Avoid **`margin-top`** for stacking siblings; use **`gap`**. Exceptions: **`scroll-margin-top`**, **`margin-top: auto`** (flex push), and explicit **`margin-top: 0`** resets on headings.
- No redundant comments in CSS; names and structure should read clearly.
- Run **`pnpm lint:css`** before pushing; CI runs Stylelint on `src/**/*.css` ([`platform.md`](platform.md)).

### Typography

Two typefaces, used by role—not ad hoc per component:

| Role | Token | Use for |
|------|--------|---------|
| **Sans (Assistant)** | `--font-family-body` / `--font-family-heading` | Body copy, headings, buttons, form controls, descriptions |
| **Mono (JetBrains Mono)** | `--font-family-meta` | Eyebrows, stats, metadata, loading/status text, fine print |

Mono text uses **`--text-meta-*`** size tokens (2px smaller than the matching **`--text-*`** scale) because JetBrains Mono runs large at equal pixel sizes. Example: **`--text-meta-xs`** for captions and **`--text-meta-sm`** for compact meta lines (e.g. releases header “Showing X releases” count).

- **Default**: `html` / `body` set `--font-family-body`. Headings inherit `--font-family-heading` (same sans stack). Buttons and inputs use **`font-family: inherit`**.
- **Shared classes**: [`src/styles/typography.module.css`](../../src/styles/typography.module.css) — `brandEyebrow`, `sectionEyebrow`, `displayHeading`, `lead`, `sectionHeading`, `subsectionHeading`, `bodyText`, `metaCaption`. Compose with local layout classes (width, alignment) in component modules. Screen-reader-only text uses [`src/styles/accessibility.module.css`](../../src/styles/accessibility.module.css) (`.visuallyHidden`).
- **Do not** set `var(--font-assistant)` or `var(--font-mono)` directly in component CSS—use the semantic tokens above or shared typography classes.
- **Nav and segmented controls** (ViewToggle, Settings theme dropdown) use **`--nav-link-font-family`** / **`--nav-link-font-size`**, which map to the sans stack.
- **Exceptions**: Some dense UI keeps **`--text-xxs`** (not `--text-meta-*`) even with mono—e.g. release catalog pills (`.metaCatalog` in `ReleaseCardMeta.module.css`). Prefer meta tokens for new mono lines unless the design needs the extra-small sans-scale size.

## Testing

Jest with **jsdom** ([`jest.config.ts`](../../jest.config.ts), [`.jest/setupTests.ts`](../../.jest/setupTests.ts)). Prefer **`screen`** and **`userEvent`** in specs.

**Playwright** ([`playwright.config.ts`](../../playwright.config.ts), [`e2e/`](../../e2e/)): instant-navigation regression tests with **`instant()`** from **`@next/playwright`**. Run **`pnpm test:e2e:install`** once, then **`pnpm test:e2e`** (starts dev on port **6767**). Not part of CI yet.

**Behavior first:** Write tests for the behavior you expect—user-visible outcomes, hook side effects, API contracts—not for whatever the current implementation happens to do. If a new or updated test fails, treat that as a signal to fix the production code (or the test setup), not to weaken the assertion so it passes. Prefer correcting bugs and regressions over bending specs to match broken behavior.

### Page object pattern

- **Base class**: [`src/tests/BasePageObject.po.ts`](../../src/tests/BasePageObject.po.ts).
- **Per-component page object** (when useful): `<Name>.po.tsx` extends `BasePageObject`, sets **`testId = "fmd<ComponentName>"`**, holds **test data, mocks, and setup/render helpers only**—**not** wrappers around every `screen.getBy*`. **POs never assert and never call `screen.find*` / `getBy*` / `queryBy*` / `waitFor`.**
- **Render helpers**: Set component defaults on the JSX element, then spread overrides: `{...overrides}`. Do **not** use conditional spreads like `{...(overrides.foo !== undefined && { foo: overrides.foo })}`.
- **Shared element helpers**: When `render*` and `rerender*` need the same JSX, extract a private `*Element(overrides)` method and reuse it—specs call `po.rerender*(rerender, overrides)`, not `rerender(<Component />)` directly.
- **Mocks in POs**: Put `jest.mock(...)` in the PO when the component depends on context or modules. Specs import the **PO first** (before the component) so mocks apply before the component module loads. When production wraps the component in a layout and server footer, the PO **`render*`** helper should use the same wrapper and mock server-only children (see [components.md → Testing](components.md#testing)).
- **Specs**: Use **`* .spec.ts(x)`** co-located with source — **`<Name>.spec.tsx`** for component tests with page objects (import the PO from **`src/components/<Name>/<Name>.po`**), and **`* .spec.ts`** / **`* .spec.tsx`** for context, hook, util, and route tests. Import **`describe`**, **`it`**, **`expect`**, and lifecycle hooks from **`@jest/globals`** in every test file (not ambient globals). Use the global **`jest`** object for **`jest.mock`**, **`jest.fn`**, **`jest.spyOn`**, and **`jest.mocked`**—do **not** import **`jest`** from **`@jest/globals`** (that breaks the mock registry). Import Testing Library helpers from the **`test-utils`** alias. Jest DOM matchers are wired in [`.jest/setupTests.ts`](../../.jest/setupTests.ts) via **`@testing-library/jest-dom/jest-globals`**; types come from [`.jest/jest-dom-globals.d.ts`](../../.jest/jest-dom-globals.d.ts).
- **Assert on literal user-visible strings in specs**, not `po.someField` read back from the PO—repeat the literal in both PO factory/render setup and `screen.getBy*` / `expect` so coupling stays visible.
- **Custom render**: Use **`render`** and **`renderHookWithTestProviders`** / **`renderFeatureHook`** from **`test-utils`** ([`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)). Both wrap with [`TestProviders`](../../src/tests/utils/testProviders.tsx)—pass **`authInitialState`**, **`skipInitialAuthCheck`**, and optionally **`includeCrate: false`** ( **`renderFeatureHook`** defaults **`includeCrate: false`** ). Prefer this over hand-rolling provider stacks. Global styles load via **`src/styles/global.css`** in test-utils (same as rhythm-marketing). Pass a custom **`wrapper`** only when a test intentionally needs a subset (e.g. “outside provider” error cases). **`renderHookWithTestProviders`** composes a custom **`wrapper`** *inside* **`TestProviders`** (outer)—use [`SeedCollectionFilters`](../../src/tests/utils/seedCollectionFilters.tsx) this way for hook tests that need collection + filter facet state.
- **`TestProviders` auth defaults**: **`skipInitialAuthCheck`** defaults to **`true`** so most component tests get a stable idle auth state without async **`checkAuthStatus`** updates (avoids act warnings). Pass **`skipInitialAuthCheck={false}`** only when testing real mount-time auth (e.g. **`auth.context.spec.tsx`** with a minimal **`QueryClientProvider` + `AuthProvider`** wrapper). Optional **`authInitialState`** seeds **`AuthProvider`**; when **`skipInitialAuthCheck`** is **`false`** and **`authInitialState`** is omitted, production initial state (**`isCheckingAuth: true`**, **`isLoading: false`**) applies. Presets live in [`testAuthStates.ts`](../../src/tests/utils/testAuthStates.ts). Do **not** suppress act warnings in **`setupTests.ts`**—fix async provider setup instead.
- **`TestProviders` collection sync**: Includes **`CollectionDataSync`** by default (aligned with production **`Providers`**). Pass **`includeCollectionSync: false`** when a test seeds collection/filter state manually (**[`SeedCollectionFilters`](../../src/tests/utils/seedCollectionFilters.tsx)**) or asserts pristine **`CollectionContextProvider`** defaults.
- **`TestProviders` playback**: Includes **`PlaybackReleaseClickProvider`** so **`useRegisterPlaybackReleaseClick`** works in component tests (aligned with global **`Providers`**). **`ReleasePlaybackProvider`** is **not** mounted in **`TestProviders`**—adding it globally breaks playback context/hook tests that supply their own provider. PO **`render*`** helpers for pages that open **`ReleaseModal`** with embeddable video (**`useReleaseModalPlayback`**) should wrap the SUT in **`ReleasePlaybackProvider`** inside **`render`** (see [`DashboardClient.po.tsx`](../../src/components/Dashboard/DashboardClient.po.tsx), [`CratesClient.po.tsx`](../../src/components/Crates/CratesClient.po.tsx), [`ReleasesClient.po.tsx`](../../src/components/ReleasesClient/ReleasesClient.po.tsx)). [`DashboardClient.po.tsx`](../../src/components/Dashboard/DashboardClient.po.tsx) also mocks dashboard chart components (**`fmdChartStub`**) and mounts **`CollectionLoadingToast`** for pagination loading assertions.
- **Tracklist specs (queue + play)**: When embeddable videos exist, each row has a play **`button`** and an **Add to queue** control (**`data-testid="fmdReleaseTrackQueueButton"`**). **`getByRole("button", { name: /track title/ })`** can match both—prefer **`getByText`** for the title, **`getAllByTestId("fmdReleaseTrackQueueButton")`**, or row-scoped queries (see [`ReleaseTracklist.spec.tsx`](../../src/components/ReleaseModal/ReleaseTracklist.spec.tsx), [`ReleaseModal.spec.tsx`](../../src/components/ReleaseModal/ReleaseModal.spec.tsx)).

### Jotai state in components

- **Read** filter/view slices via [`useFilterAtoms.hook.ts`](../../src/hooks/useFilterAtoms.hook.ts) and [`useViewAtoms.hook.ts`](../../src/hooks/useViewAtoms.hook.ts)—not **`useFilters()`** / **`useView()`** in new app code (Biome guardrail; context modules and tests exempt).
- **Write** filter actions via **`useFiltersDispatch()`**; view changes via **`useViewDispatch()`**.
- **Release list**: read **`useAllReleases()`** from filter atoms; only **`useCollectionData`** (and **`useCollectionReset`**) should dispatch **`SetAllReleases`**. **`useCollectionData`** uses raw **`filtersDispatchAtom`** so collection pagination does not PATCH account preferences.
- **PO mocks**: when asserting dispatch in isolation, mock **`src/hooks/useFilterAtoms.hook`** (see `SearchBar.po.tsx`, `ReleaseCard.po.tsx`) rather than **`useFilters()`**.

### Test data and factories

See **[factories.md](factories.md)** for the full factory pattern (`BaseFactory`, `KeysMatch`, `nullish`, nested factories, one file per factory).

- Factories live only under **[`src/tests/factories/`](../../src/tests/factories/)**.
- Import singletons by path (e.g. `releaseFactory` from `src/tests/factories/Release.factory`).
- Override with `.build({ field: "literal" })` for values the spec asserts on.
- **Always use factories** in tests and POs—domain entities, API response shapes, and nested objects come from **`src/tests/factories/`**, not inline object literals.
- Use **preset methods** on factories for common test shapes (e.g. `releaseFactory.withDisplayDefaults()`, `cratesResponseFactory.empty()`) instead of ad-hoc PO builder methods or repeated inline `.build({ ... })` blocks.

### What to mock (and what not)

#### Do not test React Query in feature tests

React Query is an implementation detail between **`src/api/helpers`** and UI/feature hooks. **Feature tests** (components, contexts, hooks under **`src/hooks/*.hook.ts`**) must **not** drive or assert on React Query itself.

**Do not:**

- Mock or spy on hooks under [`src/hooks/queries/`](../../src/hooks/queries/) (e.g. **`jest.mock("…/useUserPreferencesQuery")`**, [`setupDiscogsReleaseQueryMock`](../../src/tests/mocks/setupDiscogsReleaseQueryMock.ts))—that bypasses the real query → helper → outcome path.
- Import **`useQuery`**, **`useMutation`**, **`useQueryClient`**, or query hook return shapes (**`isLoading`**, **`data`**, **`isSuccess`**, **`fetchStatus`**) in feature specs.
- Seed or manipulate the cache in tests: **`queryClient.setQueryData`**, **`invalidateQueries`**, **`prefetchQuery`**, **`resetQueries`**, or passing a custom **`queryClient`** solely to control query results (exceptions below).
- Add new tests whose primary subject is a thin **`useQuery`** wrapper—cover HTTP in **route tests** and outcomes in feature tests instead.

**Do:**

- Mock **`src/api/helpers`** at the network boundary using the **canonical mock pattern** below + [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts). Let real query hooks run inside **`TestProviders`**.
- Assert **outcomes**: DOM, **`localStorage`**, Jotai atoms, context state, and helper calls (**`fetchUserPreferences`**, **`updateUserPreferences`**, etc.)—not query observer state.
- Cover HTTP contracts in **`src/app/api/**/route.spec.ts`** and fetch wiring in **`src/api/helpers.spec.ts`** ([`mockFetchResponse`](../../src/tests/mocks/mockFetchResponse.ts)).

**Mock `src/api/helpers` (always this pattern):** List only the helpers the test needs as **`jest.fn()`** in the mock factory—do **not** spread **`jest.requireActual`**, and do **not** use a shared mock-module helper. Import the named helper, then **`jest.mocked`**:

```ts
jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
}));

const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);
```

Multiple helpers: add each name to the factory object (e.g. **`fetchUserPreferences: jest.fn()`**, **`updateUserPreferences: jest.fn()`**) and **`jest.mocked`** each import. Configure return values with [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts) or **`.mockResolvedValue`**. Use the global **`jest`** object in the factory—not **`import { jest } from "@jest/globals"`** (breaks hoisting).

**No `jest.requireActual` in test mocks:** Do not spread **`jest.requireActual(...)`** to pull real implementations into a **`jest.mock`** factory. List each mocked export explicitly (**`jest.fn()`** or a small inline helper). When a component only needs **`useCrate`** stubs, mock **`useCrate`** alone and render with **`includeCrate: false`** (see [`ReleasesTable.po.tsx`](../../src/components/ReleasesTable/ReleasesTable.po.tsx)). When a route test needs pure helpers from a module that also imports DB code (e.g. **`getPaginationParams`** in [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)), copy the small helper body into the mock factory instead of importing the real module at the top level. When only one side-effect export needs stubbing (e.g. **`postYoutubePlayerCommand`**), keep it in a dedicated module ([`postYoutubePlayerCommand.ts`](../../src/utils/postYoutubePlayerCommand.ts)) and **`jest.mock`** that file only—leave pure helpers on the parent module running for real.

**Exceptions (narrow):**

- [`useCrateMutations.spec.tsx`](../../src/hooks/queries/useCrateMutations.spec.tsx)—mutation **cache updates** are the subject.
- [`useDiscogsCollectionQuery.spec.tsx`](../../src/hooks/queries/useDiscogsCollectionQuery.spec.tsx)—401 → auth recheck behavior on the collection query itself.
- Hook tests that use a minimal **`QueryClientProvider`** wrapper only for **auth context** lifecycle (e.g. [`auth.context.spec.tsx`](../../src/context/auth.context.spec.tsx)), not to stub server data.

**Feature-hook test recipe:** canonical **`jest.mock("src/api/helpers")`** → [`renderFeatureHook`](../../src/tests/utils/test-utils.tsx) → **`mockApiResponse`** → **`waitFor`** on outcomes. Examples: [`useUserPreferencesSync.hook.spec.tsx`](../../src/hooks/useUserPreferencesSync.hook.spec.tsx), [`useCollectionData.hook.spec.ts`](../../src/hooks/useCollectionData.hook.spec.ts).

- **Don't mock**: Pure helpers under [`src/utils/`](../../src/utils/)—filter, sort, format, URL helpers. Let them run in component tests.
- **Test the API directly — not query hooks**: Cover HTTP contracts in **route handler tests** ([`src/app/api/**/route.spec.ts`](../../src/app/api/)) and **client helpers** ([`src/api/helpers.spec.ts`](../../src/api/helpers.ts) with [`mockFetchResponse`](../../src/tests/mocks/mockFetchResponse.ts)). Route tests run in the default **jsdom** Jest environment—stub **`NextResponse.json`** in **`beforeEach`** when assertions call **`response.json()`** (see [`release/[id]/route.spec.ts`](../../src/app/api/release/[id]/route.spec.ts)).
- **UI / context / feature-hook tests**: Mock **`src/api/helpers`** (see **Do not test React Query** above) and render with **`TestProviders`** / **`renderFeatureHook`**. When **`CrateProvider`** mounts, stub crate endpoints with [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts). Use **`waitFor`** when asserting async outcomes after helpers resolve.
- **Real `QueryClient`**: **`TestProviders`** / [`createTestQueryClient`](../../src/tests/utils/testQueryClient.tsx) supply a real client so query hooks run; **do not** use the client as a test control surface—mock **helpers** instead.
- **Do mock**: External dependencies—**`src/api/helpers`** via the **canonical mock pattern** above; configure responses with [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts). Use [`mockFetchResponse`](../../src/tests/mocks/mockFetchResponse.ts) for fetch-level tests of [`src/api/helpers.ts`](../../src/api/helpers.ts). Also mock auth cookies/services, `next/navigation`, `IntersectionObserver`, and similar.
- **Authenticated tests + `CrateProvider`**: Default **`TestProviders`** includes **`CrateProvider`**, which runs **`useCratesQuery`** / **`useCrateQuery`** when **`authInitialState`** is authenticated and **`isCheckingAuth`** is false. If the test mocks **`src/api/helpers`** but only stubs unrelated endpoints (e.g. collection fields), React Query will still call **`fetchCrates`** / **`fetchCrate`**—undefined mocks log **`Query data cannot be undefined`**. Call [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts) in the PO **`setupMocks()`** or hook test **`beforeEach`** when default empty crate data is enough; override **`fetchCrate`** (see [`CrateSelector.po.tsx`](../../src/components/CrateSelector/CrateSelector.po.tsx)) when the test needs specific crate IDs or release counts—not by seeding **`QueryClient`** cache.
- **Viewport / `matchMedia`**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) calls [`setupMockMatchMedia`](../../src/tests/mocks/mockMatchMedia.mock.ts) each test (defaults to mobile). Pass **`{ desktop: true }`** when a test needs desktop **`(min-width: 1024px)`** / **`(max-width: 1023px)`** behavior (e.g. **`useCrateDrawer`**, **`CrateProvider`** login drawer tests).
- **Assertions**: Prefer asserting final DOM/output; avoid `expect(mockFn).toHaveBeenCalledWith(...)` when un-mocking—the output already proves wiring.

#### Login page copy

Landing marketing strings live in [`loginPageCopy.registry.ts`](../../src/constants/loginPageCopy.registry.ts) (with feature rows in [`loginFeatures.constants.ts`](../../src/components/Login/loginFeatures.constants.ts)). [`loginPageCopyLiteraryRules.spec.ts`](../../src/tests/utils/loginPageCopyLiteraryRules.spec.ts) enforces factual tone: no em dashes, embellishment terms, or banned inaccurate phrases (see [`loginPageCopyLiteraryRules.ts`](../../src/tests/utils/loginPageCopyLiteraryRules.ts)). Cursor hooks block violating edits and run the spec on session stop when copy sources change (see [`.cursor/hooks/README.md`](../../.cursor/hooks/README.md)).

### Jest notes

- **Faker 10+** is ESM-only; transpiled via **`transpilePackages`** in `next.config.ts` (see [platform.md](platform.md)).
- **SVG icons**: UI icons live in [`src/styles/icons/`](../../src/styles/icons/). Prefer **`*-thin.svg`** assets (16×16 viewBox, `stroke-width="1"`, stroke-based) for controls and actions. Keep filled brand assets (logos, Discogs mark) as-is. Import thin icons directly—do not mix legacy `*-solid.svg` or text glyphs (e.g. `×`) in button rows beside thin icons. When Turbopack dev hits **“module factory is not available”** on an SVGR chunk (modals, playback, portaled selects), use matching TSX components under [`src/components/shared/icons/`](../../src/components/shared/icons/) instead of `*.svg` imports (**`CheckThinIcon`**, **`ChevronRightThinIcon`**, etc.).
- **SVG (tests)**: mocked globally via [`.jest/__mocks__/svg.js`](../../.jest/__mocks__/svg.js).
- **fetchMock**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) enables and resets **`jest-fetch-mock`** each test (rhythm-marketing pattern).
- **jsdom globals**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) stubs **`window.scrollTo`** (jsdom does not implement it) and **`ResizeObserver`** each test. Specs that assert scroll behavior (e.g. **`ViewToggle.po.tsx`**) may replace **`window.scrollTo`** with a spy in the test or PO helper.
- **Base UI (jsdom)**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) also polyfills **`PointerEvent`**, mocks **`HTMLElement.prototype.getBoundingClientRect`**, and injects CSS so portaled popups are interactable in tests (`[data-starting-style]` / `[data-ending-style]`). Specs for **`Select`**, **`AutocompleteSelect`**, **`UserActions`**, and **`CrateDetailActionsMenu`** use **`userEvent.setup({ pointerEventsCheck: 0 })`** so jsdom can open Base UI popups; query portaled **`option`** / **`menuitem`** nodes with **`{ hidden: true }`** when needed. Shared filter-control helpers in [`filterControlTestHelpers.ts`](../../src/tests/filterControlTestHelpers.ts): **`openFilterCombobox`** (click trigger, **`waitFor`** **`aria-expanded="true"`**, wait for the search placeholder) and **`clickFilterOption`**. Test combobox **filtering and empty-state copy** in **`AutocompleteSelect.spec.tsx`** (isolated); **`FiltersDrawer.spec.tsx`** only smoke-tests that drawer wiring opens the control. After opening a combobox or menu manually, **`waitFor`** **`aria-expanded="true"`** on the trigger or for the **`menu`** role to appear.
- **Date-dependent copy**: When production code reads **`new Date()`** for calendar-day strings (e.g. dashboard **On this day** ledes in [`buildDashboardStory`](../../src/utils/dashboardStory.ts)), pin the clock in the spec with **`jest.useFakeTimers()`** + **`jest.setSystemTime(...)`** and restore in **`afterEach(() => jest.useRealTimers())`**. Do not hardcode **"August 7"** (or similar) against live **`Date.now()`**—CI timezones and midnight rollovers will flake (see [`dashboardStory.spec.ts`](../../src/utils/dashboardStory.spec.ts)).
- **PO mock reset**: Use **`jest.resetAllMocks()`** in PO constructors or **`setupMocks()`**.

## Test IDs

- Root element for tested components: **`data-testid="fmd<ComponentName>"`** (e.g. `fmdReleaseCard`). **PascalCase** matches the component name.
- Page object **`testId`** must match the component root **`data-testid`** so specs can use **`screen.getByTestId(po.testId)`**.
- Avoid generic roots like `data-testid="wrapper"` for primary surfaces.

## Accessibility

Baseline for keyboard and screen reader support.

- **Semantic HTML**: heading levels, **`<button>`** for actions, **`Link`** for navigation, lists for lists.
- **Forms**: Label inputs (`htmlFor` / `id`) or **`aria-label`** / **`aria-labelledby`** when there is no visible label.
- **Images**: Required **`alt`** on every **`Image`**; **`alt=""`** when decorative.
- **Keyboard**: Focusable controls; overlays/menus must not trap focus incorrectly.
- **Motion**: Honor **`prefers-reduced-motion`** for large or looping animations when practical.

## Comments

Avoid redundant comments. Prefer clear names and small functions. Comment only non-obvious behavior, workarounds, or business rules not visible from code.

## Editor

Use **2 spaces**, **UTF-8**, and **final newlines** so diffs stay clean.

## React Query

Keep **`useQuery` / `useMutation`** out of fat components—use dedicated hooks under **`src/hooks/queries/`**.

- **Dedicated hook file** per query or mutation (e.g. [`useDiscogsCollectionQuery.ts`](../../src/hooks/queries/useDiscogsCollectionQuery.ts)).
- **Query keys**: Centralized in [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts). Use key factories in hooks and in any **`invalidateQueries`** / **`setQueryData`** call sites.
- **Hook params: single object** (e.g. `useDiscogsCollectionQuery({ username, enabled })`) with a params interface in the same file.
- **Keep query hooks dumb**: `queryKey`, `queryFn`, `enabled`, `select`, etc. only—no `useEffect`, `onSuccess`, or `onError` inside query hook files. No `console.error` in `queryFn`.
- **Side effects at the call site**: Read `isError` / `error` in the component and react there (logging, toasts, etc.).
- **API layer**: Hooks call helpers in [`src/api/helpers.ts`](../../src/api/helpers.ts)—not raw `fetch` in hook files, not Discogs directly from the browser (see [patterns.md](patterns.md)).
