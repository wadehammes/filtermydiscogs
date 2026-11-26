## Feature playbooks (touch order)

Ordered checklists for common changes—extend, do not fork, existing modules.

### New client filter or sort behavior

1. Read [patterns.md](patterns.md) (filters) and [glossary.md](glossary.md) (session vs saved prefs).
2. **Atoms** — [`filters.atoms.ts`](../../src/atoms/filters.atoms.ts) / [`useFilterAtoms`](../../src/hooks/useFilterAtoms.hook.ts); persist only when product requires **`User.preferences`** sync.
3. **UI** — filters drawer / header controls; CSS under existing block classes ([conventions.md](conventions.md)).
4. **Tests** — util spec if logic is pure; else [`useFilterAtoms.hook.spec.ts`](../../src/hooks/useFilterAtoms.hook.spec.ts) or PO-owned component spec; factories for release data.
5. **Docs** — [patterns.md](patterns.md) if behavior or persistence changes.

### New `api.*` method + App Route

1. [api-routes.md](api-routes.md) auth tier + [database.md → Request validation](database.md#api-routes).
2. Zod schema in [`src/lib/validation/`](../../src/lib/validation/).
3. Handler under [`src/app/api/`](../../src/app/api/) — **`getVerifiedUserFromRequestWithRateLimit`** where required; **`privateRouteJson`** for private JSON.
4. Endpoint in [`src/api/endpoints/`](../../src/api/endpoints/) + wire [`urls.ts`](../../src/api/urls.ts).
5. React Query hook/mutation + query keys if client-facing.
6. **`route.spec.ts`** + hook/mutation spec; update [api-routes.md](api-routes.md) / [database.md](database.md) tables.

### New React Query hook or mutation

1. [decisions.md → Client state](#client-state-and-data) — do not add specs under `src/hooks/queries/`.
2. Call **`api.*`** only from hook; components use the hook.
3. Query keys in existing `*QueryKeys` module; align stale time with neighbors in [patterns.md](patterns.md).
4. **TDD** — flat `describe`, factories, mock `api` in `beforeEach` ([conventions.md](conventions.md)).
5. Update [patterns.md](patterns.md) React Query table if the hook is part of a documented flow.

### New UI component

1. **`pnpm scaffold <Name>`** — [components.md](components.md).
2. PO if interactions need API/auth mocks; **`.spec.tsx`** imports PO only.
3. If release/playback/crate context needed, use documented test trees ([conventions.md → TestProviders](conventions.md#testing)).
4. No comments rule; mobile-first CSS; `data-testid` via `fmd…` on PO.

### New GTM analytics event

1. [platform.md → Analytics](platform.md#analytics) — add helper in [`productAnalyticsEvents.ts`](../../src/analytics/productAnalyticsEvents.ts) only (pushes **`dataLayer`**; no server ingest).
2. Fire from **completed action** in hook/context success path—not raw button `onClick`.
3. **`productAnalyticsEvents.spec.ts`** + consent gating ([patterns.md](patterns.md)).

### Playback / queue behavior change

1. [playback-embed-invariants.md](playback-embed-invariants.md) + [playback-manual-queue.md](playback-manual-queue.md).
2. Prefer pure utils in [`src/utils/`](../../src/utils/) with spec first; keep provider/hook thin.
3. Mock YouTube helpers per [conventions.md → Playback specs](conventions.md#testing).
4. Update invariant doc search strings if embed contract shifts.

### Storage, prefs, or clear-data

1. [data-storage.md](data-storage.md) — keys in [`storageKeys.ts`](../../src/constants/storageKeys.ts).
2. Server: [`user/preferences`](../../src/app/api/user/preferences/route.ts) or Prisma schema ([database.md](database.md)).
3. About/Legal/Settings copy if user-visible policy changes ([data-storage.md](data-storage.md) checklist).

