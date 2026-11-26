## Testing: which layer

| If you are testing… | Prefer | Avoid |
| ------------------- | ------ | ----- |
| Component UI + interactions | **`<Name>.spec.tsx`** + **`<Name>.po.tsx`** (mocks in PO) | `mockApiResponse` inside `.spec.tsx` |
| Hook behavior (queries/mutations bypassed) | **`* .hook.spec.ts`** — mock **`api.*`** in `beforeEach`, flat **`describe`** | Mocking files under `src/hooks/queries/` |
| Pure merge/sort/cache logic | **`src/utils/*.spec.ts`** first (TDD) | Heavy logic only in hook specs |
| App Route Handler | Co-located **`route.spec.ts`** | Component test as API substitute |
| Playback queue / embed contract | Themed **`releasePlayback.context.*.spec.tsx`** + [playback-embed-invariants.md](playback-embed-invariants.md) | One giant playback spec |
| Full browser journey | **Playwright** under `e2e/` with MSW fixture | Duplicating E2E logic in Jest |

Details: [conventions.md → Non-negotiables](conventions.md#non-negotiables-substantive-work-and-agents) (including **`st`** / gh-stack §8), [conventions.md → Testing](conventions.md#testing).

