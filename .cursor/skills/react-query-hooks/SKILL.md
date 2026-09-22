---
name: react-query-hooks
description: >-
  Query and mutation hooks under src/hooks/queries and mutations — keys, dumb
  hooks, no specs in those folders.
---

# React Query hooks

Handbook: [conventions.md → React Query](../../docs/handbook/conventions.md#react-query), [patterns.md → React Query](../../docs/handbook/patterns.md#react-query).

## Layout

- **Reads:** `src/hooks/queries/` — one file per query (e.g. `useDiscogsCollectionQuery.ts`).
- **Writes:** `src/hooks/mutations/` — e.g. `useCrateMutations.ts`.
- **Keys:** [`querykeys.constants.ts`](../../src/hooks/queries/querykeys.constants.ts) — use factories everywhere you invalidate/set.

## Hook file rules

- **Dumb only:** `queryKey`, `queryFn`, `enabled`, `select` — no `useEffect`, `onSuccess`, `onError`, no `console.error` in `queryFn`.
- Side effects in **components** or feature hooks (toasts, logging).
- Hooks call **`api.*`** from [`urls.ts`](../../src/api/urls.ts) — not raw `fetch`, not Discogs from browser.

## Testing

- **Do not** add specs under `queries/` or `mutations/`.
- Cover HTTP in **`route.spec.ts`** / MSW endpoint specs; cover UI outcomes in feature tests with mocked **`api.*`** (skill **`hook-feature-specs`**).
