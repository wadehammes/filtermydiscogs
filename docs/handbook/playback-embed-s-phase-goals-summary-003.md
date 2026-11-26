## Phase goals (summary)

- **Phase 0** — Name invariants and spec search strings so refactors have a checklist ([playback-embed-invariants.md](playback-embed-invariants.md)).
- **Phase 1** — Discriminated embed session state + `reduceEmbedSession` / selectors (hidden poll, watchdog arm policy, confirm pending).
- **Phase 2** — One `tryConfirmFromSignal(...)` instead of parallel confirm utils at the iframe boundary.
- **Phase 3** — Provider owns queue/session only; embed hook posts messages → session events.
- **Phase 4** — Delete superseded utils/refs; update [patterns.md → Release playback queue](patterns.md#release-playback-queue) to describe session module as source of truth. _(Partially done: session wired; ref deletion deferred.)_
- **Phase 5** — Provider integration specs split by invariant theme (one flat **`describe`** per file). **`jest.mock`** and **`beforeEach`** stay in each spec file; shared factories and helpers live in **`releasePlayback.context.spec.harness.tsx`** (edit those files directly — no codegen).

