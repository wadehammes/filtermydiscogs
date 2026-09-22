---
name: overlays-and-base-ui
description: >-
  Dialogs, Select, AutocompleteSelect, Menu, OverlayStack portals. Use for modals,
  filter dropdowns, and popover menus.
---

# Overlays and Base UI

Handbook: [components.md](../../docs/handbook/components.md) (`AppDialog`, `ScrollModal`, `Select`, `AutocompleteSelect`, `InlinePopoverMenu`), conventions modal/filter CSS (link only — use skill **`css-modules`** for CSS edits).

## Primitives

| UI | Component |
|----|-----------|
| Modal shell | [`AppDialog`](../../src/components/AppDialog/AppDialog.component.tsx), [`FormDialog`](../../src/components/FormDialog/FormDialog.component.tsx), [`ScrollModal`](../../src/components/ScrollModal/ScrollModal.component.tsx) |
| Filter single select | [`Select`](../../src/components/Select/Select.component.tsx) — Base UI Select |
| Filter multi / search | [`AutocompleteSelect`](../../src/components/AutocompleteSelect/AutocompleteSelect.component.tsx) — combobox, input-in-popup |
| Action menus | [`InlinePopoverMenu`](../../src/components/InlinePopoverMenu/InlinePopoverMenu.component.tsx) — UserActions, FilterViewsMenu, ReleaseCrateMenu |

## Portals

- **`OverlayStack`** + **`usePortaledOverlayContainer`** — filter popups escape drawer/shell stacking ([`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx), [`BottomDrawer`](../../src/components/BottomDrawer/BottomDrawer.component.tsx)).
- **`modal={false}`** on filter comboboxes/menus where documented.

## Do not

- Reimplement modal title/footer spacing — use **`FormDialog`** sections.
- Nest remove buttons inside native button triggers (multi-select combobox pattern in handbook).
- Hand-wire **`fieldset`/`legend`** for segmented controls — use **[`SegmentedControl`](../../src/components/SegmentedControl/SegmentedControl.component.tsx)**.

Tests: **`filterControlTestHelpers`**, **`Select.spec.tsx`**, **`FiltersDrawer.spec.tsx`**, **`OverlayStack.spec.tsx`**.
