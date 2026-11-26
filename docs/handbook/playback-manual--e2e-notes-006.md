## E2E notes

- MSW release stubs use harness video id **`e2eNorm0001`** ([`e2eEmbedMock.constants.ts`](../../src/constants/e2eEmbedMock.constants.ts)) so playback confirms against the local mock iframe without real YouTube (also works when Playwright reuses a **`next dev`** server without the global mock flag).
- **Desktop-only** tag — queue drawer reorder uses pointer drag on the dock (same as [`authenticated-playback-queue.spec.ts`](../../e2e/authenticated-playback-queue.spec.ts)).
- **Smoke** (`E2E_SMOKE=1`): long watchdog settle cases are tagged **`@full-suite`** and omitted by **`grepInvert`** — same policy as [`authenticated-embed-watchdog.spec.ts`](../../e2e/authenticated-embed-watchdog.spec.ts) **`normal`** / **`delayed`** cases.
- Delayed release detail uses [`createE2eDelayedReleaseByIdHandler`](../../src/tests/msw/e2eReleaseHandlers.ts) — approximates slow first **`GET /api/release/:id`** after login; the exact “play before fetch returns” timing is owned by Jest context specs (iframe + deferred promise).

