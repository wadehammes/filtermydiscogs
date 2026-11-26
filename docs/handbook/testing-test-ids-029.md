## Test IDs

- Root element for tested components: **`data-testid="fmd<ComponentName>"`** (e.g. `fmdReleaseCard`). **PascalCase** matches the component name.
- Sub-surface hooks when the root is not the right query target: e.g. **`fmdFilterPillsScroll`** on multi-select **`AutocompleteSelect`** pill rows (**`HorizontalScrollRow`** inside the combobox trigger), **`fmdReleaseCardPillsRow`** on desktop **`ReleaseCard`** tag rows, **`fmdCrateDrawerReleaseItem`** / **`fmdReleaseSimilarItem`** / **`fmdDashboardReleaseItem`** on row shells for hover-prefetch specs.
- Page object **`testId`** must match the component root **`data-testid`** so specs can use **`screen.getByTestId(po.testId)`**.
- Avoid generic roots like `data-testid="wrapper"` for primary surfaces.

