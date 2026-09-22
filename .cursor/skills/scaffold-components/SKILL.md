---
name: scaffold-components
description: >-
  Add new UI components with pnpm scaffold. Use when creating components under
  src/components, page objects, or fmd test ids.
---

# Component scaffold

Handbook: [components.md → Scaffolding](../../docs/handbook/components.md#scaffolding). Cursor **blocks** hand-created component folders (`enforce-scaffold.sh`).

## Steps

1. Run **`pnpm scaffold <ComponentName>`** (PascalCase name).
2. Edit generated files — do not create parallel folders by hand.
3. Delete **`Name.interfaces.ts`** when it only re-exports types already on the component.
4. Skip/delete generated factory if there is no structured domain model.
5. Add factories under **`src/tests/factories/`** when tests need domain data.

## Generated layout

- `Name.component.tsx` — root **`data-testid="fmd<Name>"`**
- `Name.module.css`, `Name.spec.tsx`, `Name.po.tsx`

Import CSS as `import styles from "./Name.module.css"`. Use **`classNames`** for conditional classes. Icon controls → **[`IconButton`](../../src/components/IconButton/IconButton.component.tsx)**.
