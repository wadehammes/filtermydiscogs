---
name: filters-and-jotai
description: >-
  Collection filters, Jotai atoms, saved views, FiltersBar/FiltersDrawer. Use when
  changing filter UI, facets, or session/persisted filter state.
---

# Filters and Jotai

Handbook: [patterns.md → Filtering and sorting](../../docs/handbook/patterns.md#filtering-and-sorting).

## Data flow

1. **`useCollectionData`** loads collection → **`SetAllReleases`** into filter pipeline (via **`filtersDispatchAtom`** for hydration — not **`useFiltersDispatch()`** during bulk load).
2. **`filters.atoms.ts`** → **`filteredReleases`**, **`useFacetOptions()`**, sort atoms.
3. UI: **`FiltersBar`**, **`FiltersDrawer`**, **`FilterViewsMenu`**, **`SearchBar`**, **`Select`** / **`AutocompleteSelect`**.

## Persistence

- **`sessionFiltersAtom`** — what UI reads/writes in session.
- **`User.preferences.filters`** + **`localStorage`** when **`persistFilters`** (debounced PATCH via **`useFiltersDispatch()`**).
- **Saved views** — **`filterViews`** on user; **`useFilterViews`**, **`SaveFilterViewDialog`**.

## Rules

- Add dimensions in **atoms + utils** (`filterReleases`, `computeFilterDerivedState`) — not ad hoc filtering in leaf components.
- Prefer **`useFilterAtoms`** / **`useViewAtoms`** — avoid **`useFilters`** / **`useView`** in app code (Biome restricted imports).
- **`collectionFiltersActiveAtom`** — session filters apply only after full collection load.

## Key files

[`filters.atoms.ts`](../../src/atoms/filters.atoms.ts), [`filterReleases.ts`](../../src/utils/filterReleases.ts), [`useFiltersDispatch`](../../src/hooks/useFiltersDispatch.hook.ts) (via filters context).
