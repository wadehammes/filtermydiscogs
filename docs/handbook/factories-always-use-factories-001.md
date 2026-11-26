## Always use factories

**Default rule:** Any structured test data or mocked return value with a named type—domain entities, auth/session shapes, API payloads, nested objects—comes from a factory under **`src/tests/factories/`**, not an inline object literal in a spec or PO. This is a [Testing non-negotiable](conventions.md#non-negotiables-substantive-work-and-agents) alongside TDD and flat hook **`describe`** blocks—especially for **`src/hooks/*.hook.spec.ts(x)`** ([checklist](conventions.md#hook-and-feature-spec-checklist)). The same rule applies to **Playwright E2E** ([`e2e/`](../../e2e/) specs and [`e2e/helpers/`](../../e2e/helpers/)): compose MSW stubs with factories and shared E2E builders under [`src/tests/msw/`](../../src/tests/msw/) (e.g. [`buildE2eCollectionReleases`](../../src/tests/msw/e2eCollectionData.ts), [`buildE2eReleaseDetailByDiscogsId`](../../src/tests/msw/e2eReleaseDetailData.ts))—do not hand-roll **`DiscogsRelease`** / **`DiscogsReleaseDetail`** rows in helpers.
- **PO `setupMocks()`**, hook specs, route specs, and **E2E MSW helpers**: **`mockResolvedValue(authStatusFactory.authenticated())`**, **`userPreferencesFactory.defaultsApiResponse()`**, **`verifiedDiscogsUserFactory.asVerifiedResult()`**, etc.—not `{ isAuthenticated: true, username: "testuser", … }`.
- **Preset methods** (`authenticated()`, `empty()`, `forUser()`, `dashboardDefaults()`, …) exist for repeated shapes; prefer them over copying literals across files.
- **Missing factory?** Add one (see [Adding a new factory](#adding-a-new-factory)) or extend an existing factory with a preset—do not leave inline mocks for types that appear in more than one test file.

**Exceptions (inline literals are fine):**
- **Exact route JSON assertions** where the test documents a specific HTTP response contract (status codes, error bodies, rate-limit headers).
- **Minimal non-domain stubs** (`{ count: 0 }` from Prisma **`updateMany`** / **`deleteMany`**, `NextResponse.json({ error: "…" })`). For **select-shaped** Prisma **`findMany`** / **`update`** results, use **row factories** + **`mockPrismaDelegate`** ([`mockPrismaDelegate.ts`](../../src/tests/helpers/mockPrismaDelegate.ts)); for **partial transaction clients** in layout specs, [`crateLayoutPrismaTransaction.ts`](../../src/tests/helpers/crateLayoutPrismaTransaction.ts).
- **User-visible strings** duplicated in spec assertions (see [conventions.md → Testing](conventions.md#testing)—do not read literals back from the PO).

When adding a new **`AuthStatus`**, **`VerifiedUserResult`**, preferences wrapper, or similar field to a type, update the matching factory (and **`KeysMatch`** guard) in the same PR so tests stay typed.

