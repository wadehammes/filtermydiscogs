---
name: typescript-react-guardrails
description: >-
  TS/React house style — arrow functions, classNames, definedProps, no any, Link.
  Use when writing or reviewing src/**/*.tsx and utils.
---

# TypeScript and React guardrails

Handbook: [conventions.md → TypeScript](../../docs/handbook/conventions.md#typescript), [React / JSX](../../docs/handbook/conventions.md#react--jsx).

## TypeScript

- Arrow functions for app code; **`export async function GET`** / page defaults where Next requires it.
- **`if` / loops always `{ }`** — no one-line bodies without braces.
- No **`any`**, no non-null **`!`** — use `??`, optional chaining, checks.
- No nested ternaries; no barrel **`index.ts`** under `src/`.
- Imports: **`src/…`** absolute (except co-located CSS/assets, factory siblings).
- Multi-arg helpers: **single params object** + interface.
- **`exactOptionalPropertyTypes`**: optional props omitted or set — never **`undefined`** explicitly.
  - **`className`**: **`classNames(...)`**
  - Other optionals: **`definedProps({ … })`** ([`definedProps.ts`](../../src/utils/definedProps.ts))

## JSX

- Conditional render: ternary if condition could be **`0`** / falsy display bug — not **`&&`** for components.
- **`classNames`** for combined/conditional classes (object notation for state).
- Nav links: **`next/link`** **`Link`** with **`rel="noopener noreferrer"`** when **`target="_blank"`**.
- Forms with input: **React Hook Form + Zod** ([`src/lib/validation/`](../../src/lib/validation/)).
- Icon controls: **[`IconButton`](../../src/components/IconButton/IconButton.component.tsx)** — no `cloneElement` for icon hover.
