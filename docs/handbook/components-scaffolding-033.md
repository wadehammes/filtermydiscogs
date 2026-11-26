## Scaffolding

Run **`pnpm scaffold <ComponentName>`** ([`scripts/scaffold.sh`](../../scripts/scaffold.sh)) to generate:
- `Name.component.tsx` with root **`data-testid="fmd<Name>"`**
- `Name.module.css`
- `Name.spec.tsx` (assertions via **`screen`**; imports PO first)
- `Name.po.tsx` with typed **`renderName(overrides)`**, defaults + `{...overrides}`, and optional private **`*Element()`** helper (see [conventions.md → Testing](conventions.md#testing))

Add factories under **`src/tests/factories/`** when structured test data is needed.

**After scaffold, trim boilerplate you will not use:**
- Delete **`Name.interfaces.ts`** when it would only re-export types already defined on the component or a colocated helper (e.g. [`IconButton`](../../src/components/IconButton/) — props and **`IconButtonVariant`** live on the component / [`iconButtonClasses.ts`](../../src/components/IconButton/iconButtonClasses.ts); no factory).
- Skip / delete the generated factory when the component has no structured domain model to build in tests.
- Do **not** hand-create component folders — always run **`pnpm scaffold`** first, then edit the generated files.
