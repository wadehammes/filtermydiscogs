## Naming

- Prefer **`.component.tsx`** for the main React export in a feature folder.
- **Client page shells** use **`*Client.tsx`** or **`*Client.component.tsx`** under [`src/components/`](../../src/components/), imported from a server [`page.tsx`](../../src/app/about/page.tsx) in **`src/app/`** (routing only — no co-located components or CSS modules in route folders).
- Keep **one primary component file** per folder unless the feature is large enough to justify split files (hooks, subcomponents).
