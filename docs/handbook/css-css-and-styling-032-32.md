- **JS layout queries** live in [`layoutMediaQueries.ts`](../../src/constants/layoutMediaQueries.ts): **`DESKTOP_LAYOUT_MEDIA_QUERY`** (≥1024 — sidebar crate drawer, filters bar, desktop cards), **`BELOW_DESKTOP_LAYOUT_MEDIA_QUERY`** (bottom drawer shell), **`COMPACT_LAYOUT_MEDIA_QUERY`** (≤768 — queue toasts, floating video, list-view coercion on `/collection`), **`TABLET_UP_MEDIA_QUERY`** (≥768 — public marketing nav). Do not duplicate raw `matchMedia` strings in components. Jest coverage: [`layoutMediaQueries.spec.ts`](../../src/constants/layoutMediaQueries.spec.ts) (**`layoutMatchesMediaQueryAtWidth`**, **`RESPONSIVE_VIEWPORT_PRESETS`** aligned with **`LAYOUT_BREAKPOINT_*`**).
- **Responsive work (phased):** Phase 0 — walk [`RESPONSIVE_VIEWPORT_PRESETS`](../../src/constants/layoutMediaQueries.ts) on primary routes (`/collection` with crate drawer open, release modal, owner crate, dashboard). Phase 1 — shared layout queries + accurate Jest `matchMedia` width (optional **`viewportWidthPx`** on [`setupMockMatchMedia`](../../src/tests/mocks/mockMatchMedia.mock.ts)). Phase 2 — Playwright projects aligned to the same presets (see [`playwright.config.ts`](../../playwright.config.ts)). Phase 3 — **`@container`** on the releases main column when the crate drawer shrinks content, not new viewport breakpoints. Phase 4 — compact **height** (`min()`, **`--available-height`**, **`--release-modal-available-height`**) on modals and long lists — defaults in [`playback-dock.css`](../../src/styles/global/playback-dock.css) (imported from [`global.css`](../../src/styles/global.css)); dock open sets **`--release-modal-viewport-inset-bottom`** from **`--release-mini-player-bar-offset`**; e.g. [`ScrollModal.module.css`](../../src/components/ScrollModal/ScrollModal.module.css), [`ReleaseTracklist.module.css`](../../src/components/ReleaseTracklist/ReleaseTracklist.module.css), [`TopTracks.module.css`](../../src/components/Dashboard/TopTracks.module.css). Do not add Jest specs that **`readFileSync`** a **`.module.css`** (or assert raw selector strings)—cover layout in component/Playwright tests instead.
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
  - **`base.css`** — spacing, typography (**`--text-*`** scale applies **`--font-size-sans-adjust`** for DM Sans optical sizing; **`--text-meta-*`** subtracts **`--font-size-meta-nudge`** and cancels **`--font-size-sans-adjust`** so mono stays at the pre-adjust scale), transitions, z-index, pattern tokens (`--pattern-microdot`, `--pattern-microdot-size`; **`--pattern-microdot-mix`** in **`colors.css`**), component sizing (`--input-height`, **`--touch-target-min`** **`3rem`** below **`768px`**, **`2.75rem`** at **`768px+`** for mobile tap targets), and border-radius tokens (**`--radius-none`**, **`--radius-ui`**, **`--radius-card`**, **`--radius-full`**, **`--radius-spinner`**, **`--radius-circle`**, inset/calc helpers — use these in module CSS, not raw **`0`**, **`50%`**, or **`4px`**).
  - **[`patterns.module.css`](../../src/styles/modules/patterns.module.css)** — composable **`microdotbackground`** and **`microdotoverlay`** (`::before`) helpers that consume those tokens.
  - **`colors.css`** — semantic colors via **`light-dark()`** and **`color-scheme`**; **`--pattern-microdot-mix`** (higher mix in light mode so microdots stay visible on **`--background`**); **`--on-primary`**, **`--on-success`**, etc. for filled surfaces; **`--link`** / **`--link-hover`** / **`--link-active`** for inline text, nav, and outline controls; **`--ring`** aliases **`--link`** for **`:focus-visible`** outlines.
  - **`link.css`** — most named palettes set **`--link*`** to **`--primary*`**; default **`dark`** keeps split link (**`#07f`**) vs fill primary (**`#06f`**) from **`colors.css`**; **`wine`** brightens **`--link*`** (~72% primary / 28% white) so nav pills meet AA on **`--background`**.
  - **`rating-star.css`** — **`--rating-star`** aliases each palette’s **`--pill-format-foreground`** (contrast-tuned per theme); **`--rating-star-muted`** mixes that with **`--muted-foreground`** for empty picker stars.
  - **`primary.css`** — per-theme **`--primary*`** overrides and shared **`contrast-color()`** **`--on-primary*`** for non-default primaries.
  - **`palette-derivations.css`** — derives foreground, borders, shadows, and gray scale per palette; loaded after individual palette files in **`index.css`**.
  - **`ui-radius.css`** — when **`html[data-ui-radius="square"]`** (from Settings **`squareCorners`**), UI radius tokens zero out for a flat chrome; **`--radius-spinner`** is pinned to **`9999px`** (not **`var(--radius-full)`**, which square mode clears) for [`Spinner`](../../src/components/Spinner/Spinner.module.css).
  - **`surface-depth.css`** — darkest tier is **`--page-background`** ( **`background-surface.css`** on **`html`** ), from **`color-mix(in srgb, var(--background) 85%, black 15%)`** without reassigning palette **`--background`** (avoids **`@property --background`** / anchor cycles that washed palettes to white). **`--card`** / **`--muted`** / **`--secondary`** step lighter from the same anchor; skips **`light`**.
