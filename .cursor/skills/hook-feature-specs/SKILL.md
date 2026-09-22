---
name: hook-feature-specs
description: >-
  TDD and Jest patterns for feature hooks and component tests. Use when adding
  src/hooks/*.hook.spec, mocking API data, renderFeatureHook, or React Query tests.
---

# Hook and feature specs

Canonical rules: [conventions.md → Non-negotiables](../../docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents), [Hook checklist](../../docs/handbook/conventions.md#hook-and-feature-spec-checklist), [factories.md](../../docs/handbook/factories.md).

## Non-negotiables

1. **TDD** — Failing spec first; confirm red with `pnpm test -- <spec>` before production code.
2. **Factories** — [`src/tests/factories/`](../../src/tests/factories/); no hand-rolled domain objects.
3. **One flat `describe`** per hook spec — no nested `describe`; put scenarios in `it("when …, …")` names.

## Mocks

- Mock **`src/api/urls`** (`jest.mock("src/api/urls", () => ({ api: { …: jest.fn() } }))`).
- **Do not** mock `src/hooks/queries/*` or `src/hooks/mutations/*`.
- **Do not** add specs under `src/hooks/queries/` or `src/hooks/mutations/`.
- Feature tests: **`TestProviders`** / **`renderFeatureHook`**; assert DOM, `api.*`, storage — not query observer state.

## Recipe

```ts
jest.mock("src/api/urls", () => ({
  api: { discogsCollection: jest.fn() },
}));

import { api } from "src/api/urls";

describe("useMyFeature", () => {
  it("…", async () => {
    jest.mocked(api.discogsCollection).mockResolvedValue(/* mockApiResponse */);
    // renderFeatureHook + waitFor outcomes
  });
});
```

Reference specs: `useReleasePlaybackSessionPersistence.hook.spec.ts`, `useCollectionData.hook.spec.ts`.
