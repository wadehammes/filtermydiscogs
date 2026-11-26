- **Inline popover menus**: **[`InlinePopoverMenu`](../../src/components/InlinePopoverMenu/InlinePopoverMenu.component.tsx)** wraps Base UI **`Menu.Portal`** / **`Positioner`** / **`Popup`** with shared chrome from [`inline-popover-menu.module.css`](../../src/styles/modules/inline-popover-menu.module.css) — use **`InlinePopoverMenu.Panel`** (default **`positionMethod="absolute"`** like **`Select`** — avoids **`fixed`** jank when triggers live in nested scroll roots such as **`[data-releases-scroll-root]`**; optional **`scrollable`** — **`scrollable`** uses **`.popupScroll`**, which must **`composes`** **`popup`** from [`inline-popover-menu.module.css`](../../src/styles/modules/inline-popover-menu.module.css), not a local re-export), **`useOverlayStack`** for **`OverlayStack`** portal + z-index) plus **`List`** / **`Footer`** / **`Item`** / **`ItemDanger`** / **`ItemNeutral`** / **`Link`** helpers. Shared **`.item`** rows below **`1024px`**: **`min-height: var(--touch-target-min)`**, **`--text-base`**, **`var(--space-3) var(--space-4)`** padding, zero **`.list`** / **`.footer`** / **`.itemGroup`** gap; compact at **`1024px+`**. Row hover/highlight and checked states mix accent into **`--popover`** (not **`--muted`** or **`--background`**) via [`menu-item-interaction.module.css`](../../src/styles/modules/menu-item-interaction.module.css) — default hover **`color-mix(in srgb, var(--primary) 14%, var(--popover))`**, checked **`var(--link) 12%` / `18%`** on hover; danger rows use **`var(--destructive) 14%`**. Portaled **`Select`** / **`AutocompleteSelect`** **`.option`** rows follow the same **`--popover`** mix. In **[`InlinePopoverMenu.module.css`](../../src/components/InlinePopoverMenu/InlinePopoverMenu.module.css)**, **`.itemDanger`** / **`.itemNeutral`** must **`composes`** **`item`** from [`inline-popover-menu.module.css`](../../src/styles/modules/inline-popover-menu.module.css) plus the matching hover helper from [`menu-item-interaction.module.css`](../../src/styles/modules/menu-item-interaction.module.css) — do not re-export **`itemdanger`** / **`itemneutral`** (transitive **`composes`** drops base row padding/hover). Do **not** compose **`popup`** / **`list`** / **`item`** directly in feature modules; add only feature-specific **`popupClassName`** / row overrides. Consumers: **[`UserActions`](../../src/components/StickyHeaderBar/UserActions.tsx)**, **[`FilterViewsMenu`](../../src/components/FilterViewsMenu/FilterViewsMenu.component.tsx)**, **[`ReleaseCrateMenu`](../../src/components/ReleaseCard/ReleaseCrateMenu.component.tsx)** (horizontal / desktop card default **`portaled={false}`** — **`Menu.Portal`** targets **`.menuHost`** so the popup scrolls with the grid card trigger; **`layout="vertical"`** defaults **`portaled`** true so mobile row cards escape **`overflow: hidden`**), **[`CrateDetailActionsMenu`](../../src/components/Crates/CrateDetailActionsMenu.component.tsx)**, **[`ThemeSwitcher`](../../src/components/ThemeSwitcher/ThemeSwitcher.component.tsx)** (`variant="menu"`). **`ReleaseMiniPlayer`** passes **`portaled`** on **`ReleaseCrateMenu`** for dock **`OverlayStack`** / body portal. Jest: **`expectReleaseCrateMenuInlineWithTrigger`** vs **`expectReleaseCrateMenuPortaledOutOfHost`** in [`filterControlTestHelpers.ts`](../../src/tests/filterControlTestHelpers.ts). **`Menu.LinkItem`**: **`className={inlinePopoverMenuStyles.item}`** on **`Menu.LinkItem`**, **`inlinePopoverMenuStyles.link`** / **`linkRow`** on the **`Link`** **`render`** prop. Footer sections use solid **`border-top`** only; **`ReleaseCrateMenu`** alone uses a **dashed** divider between the pinned current crate and the scroll list. **`ReleaseCrateMenu`** may still tune row padding via **`--crate-menu-item-pad-inline`**; do not reimplement mobile **`min-height`** in feature modules unless a row needs a different density.

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
