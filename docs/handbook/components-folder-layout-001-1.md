## Folder layout

- **Feature components**: [`src/components/<Name>/`](../../src/components/) — one folder per component or feature area; **no nested `components/` or `shared/` tiers**. Typically:
  - `Name.component.tsx` — main React export (arrow function, typed props)
  - `Name.module.css` — scoped styles
  - Optional `Name.spec.tsx` + `Name.po.tsx` for tested components (see [conventions.md → Testing](conventions.md#testing))
  - Related pieces are **sibling folders** (e.g. [`ReleaseModal/`](../../src/components/ReleaseModal/) shell + [`ReleaseTracklist/`](../../src/components/ReleaseTracklist/) + [`ReleaseSummaryHero/`](../../src/components/ReleaseSummaryHero/) — not nested under one mega-folder)

