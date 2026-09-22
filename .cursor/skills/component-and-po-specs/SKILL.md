---
name: component-and-po-specs
description: >-
  Component Jest specs, page objects, TestProviders, api mocks. Use for
  src/components/**/*.spec.tsx and context specs.
---

# Component and PO specs

Handbook: [conventions.md → Testing](../../docs/handbook/conventions.md#testing), [Page object pattern](../../docs/handbook/conventions.md#page-object-pattern), [components.md → Testing](../../docs/handbook/components.md#testing).

## Page objects (`*.po.tsx`)

- Extend [`BasePageObject`](../../src/tests/BasePageObject.po.tsx); **`testId = "fmd<ComponentName>"`** matches component root.
- **Mocks + render helpers only** — no `screen.getBy*`, no assertions, no `waitFor` in POs.
- Defaults on JSX, then **`{...overrides}`** — no conditional spread per optional prop.
- Private **`*Element(overrides)`** shared by `render*` / `rerender*`.

## Specs

- Import PO first; assert with **`screen`** / **`userEvent`**.
- **`TestProviders`** for UI; minimal provider tree for single-context specs (see conventions).
- Mock **`src/api/urls`** — not query hooks. Use [`setupDefaultCrateApiMocks`](../../src/tests/mocks/setupDefaultCrateApiMocks.ts) when `CrateProvider` mounts.
- MSW: endpoint/client specs only ([`.jest/setupMswForApiSpecs.ts`](../../.jest/setupMswForApiSpecs.ts)); feature UI still mocks **`api.*`**.

## Hook specs

Use skill **`hook-feature-specs`** — not this file.
