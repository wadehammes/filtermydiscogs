- **Similar releases** ([`getSimilarReleases`](../../src/utils/similarReleases.ts), [`getSimilarReleasesModalPage`](../../src/utils/similarReleases.ts), modal sidebar, playback similar-queue tail): set overlapping **styles** / genres with **`releaseFactory.withStyles`** on **`allReleases`** / catalog fixtures so scoring is deterministic—not random Faker styles from a bare **`.build()`**. Pure paging/scoring behavior belongs in **`.spec.ts`** under **`src/utils/`** before hook wiring ([`similarReleases.spec.ts`](../../src/utils/similarReleases.spec.ts)); modal loading, anchor readiness, and batch helpers in colocated [`useSimilarReleasesInCollection.utils.spec.ts`](../../src/components/ReleaseModal/useSimilarReleasesInCollection.utils.spec.ts) and [`useSimilarReleasesPageState.utils.spec.ts`](../../src/components/ReleaseModal/useSimilarReleasesPageState.utils.spec.ts) (**`resolveSimilarReleasesPageState`**, **`resolveSimilarAnchorRelease`**, **`getSimilarReleasesUnsettled`** — wide shell while deferred inputs lag; list loader only when the pool is unsettled) (**`getSimilarReleasesSidebarLoading`** — including **`similarModalPool`** settled so paging does not re-enter the loader, and an empty pool while inputs are still unsettled so a hard refresh does not reserve a blank aside — and **`isDeferredSimilarAnchorReady`**); label/copy helpers in [`releaseSimilarSidebar.constants.spec.ts`](../../src/constants/releaseSimilarSidebar.constants.spec.ts) (**`formatSimilarReleaseCountLabel`**, **`getSimilarReleasePageDigitCh`**); integration: [`ReleaseModal.similar.spec.tsx`](../../src/components/ReleaseModal/ReleaseModal.similar.spec.tsx), [`useSimilarReleasesInCollection.hook.spec.tsx`](../../src/components/ReleaseModal/useSimilarReleasesInCollection.hook.spec.tsx), [`ReleaseSimilarSidebar.spec.tsx`](../../src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.spec.tsx), [`useReleasePlaybackSimilarQueue.hook.spec.tsx`](../../src/hooks/useReleasePlaybackSimilarQueue.hook.spec.tsx)).

### What to mock (and what not)

#### Do not test React Query in feature tests

React Query is an implementation detail between **`src/api/urls`** and UI/feature hooks. **Feature tests** (components, contexts, hooks under **`src/hooks/*.hook.ts`**) must **not** drive or assert on React Query itself.

**Do not:**
- Mock or spy on hooks under [`src/hooks/queries/`](../../src/hooks/queries/) (e.g. **`jest.mock("…/useUserPreferencesQuery")`**)—that bypasses the real query → helper → outcome path. For release detail, stub **`fetchDiscogsRelease`** via [`setupFetchDiscogsReleaseMock`](../../src/tests/mocks/setupFetchDiscogsReleaseMock.ts) (also stubs **`fetchTrackStats`**) and let **`useDiscogsReleaseQuery`** run in **`TestProviders`**.
- Import **`useQuery`**, **`useMutation`**, **`useQueryClient`**, or query hook return shapes (**`isLoading`**, **`data`**, **`isSuccess`**, **`fetchStatus`**) in feature specs.
- Seed or manipulate the cache in tests: **`queryClient.setQueryData`**, **`invalidateQueries`**, **`queryClient.query`**, **`resetQueries`**, or passing a custom **`queryClient`** solely to control query results (exceptions below).
- Add new tests whose primary subject is a thin **`useQuery`** wrapper—cover HTTP in **route tests** and outcomes in feature tests instead.

**Do:**
- Mock **`src/api/urls`** at the network boundary using the **canonical mock pattern** below + [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts) / **`mockPendingApiResponse`**. Let real query hooks run inside **`TestProviders`**.
- Assert **outcomes**: DOM, **`localStorage`**, Jotai atoms, context state, and **`api.*`** calls—not query observer state.
- Cover HTTP contracts in **`src/app/api/**/route.spec.ts`** (mock Prisma/services) and client **`fetch`** wiring in **`src/api/helpers.spec.ts`** / **`src/api/endpoints/`** with MSW (global [`.jest/setupMswForApiSpecs.ts`](../../.jest/setupMswForApiSpecs.ts), [`mswFetchTestHelpers`](../../src/tests/msw/mswFetchTestHelpers.ts)).

**Mock `src/api/urls` (always this pattern):** List only the **`api`** methods the test needs as **`jest.fn()`** in the mock factory—do **not** spread **`jest.requireActual`**. Import **`api`**, then **`jest.mocked`**:

```ts
jest.mock("src/api/urls", () => ({
  api: {
    discogsCollection: jest.fn(),
  },
}));

import { api } from "src/api/urls";

const mockDiscogsCollection = jest.mocked(api.discogsCollection);
```

Prefer **`jest.mock("src/api/urls")`** without a factory—Jest auto-mocks the module; configure responses with **`jest.mocked(api.discogsCollection)`** in PO **`setupMocks()`** (see [`SettingsClient.po.tsx`](../../src/components/Settings/SettingsClient.po.tsx)). List only the methods you need when using an inline factory:

```ts
jest.mock("src/api/urls", () => ({
  api: {
    discogsCollection: jest.fn(),
  },
}));
```

Use a factory when the test must stub a subset without pulling in the full mocked **`api`**. Configure return values with [`mockApiResponse`](../../src/tests/mocks/mockApiResponse.ts) (and **`mockPendingApiResponse`** from the same module when the test resolves manually) or **`.mockResolvedValue`**. Use the global **`jest`** object in the factory—not **`import { jest } from "@jest/globals"`** (breaks hoisting). **`export type Api = typeof api`** in [`urls.ts`](../../src/api/urls.ts) keeps **`jest.mocked(api.*)`** typed when methods are added.

