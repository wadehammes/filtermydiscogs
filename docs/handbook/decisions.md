# Decisions (X vs Y)

Short **choose-the-right-tool** guide for agents and contributors. When a row points to a chapter, read that chapter before editing—not this page alone.

## Quick read (agents)

If you only have a few minutes:

1. [State and data](#client-state-and-data)
2. [Tests](#testing-which-layer)
3. [API and auth](#api-and-server)
4. Glossary: [glossary.md](glossary.md)
5. Full task map: [llms.md](llms.md) — playbooks below for repeatable tasks

## Client state and data

| If you need… | Use | Not |
| ------------ | --- | --- |
| Filters, view mode, derived release lists on the client | **Jotai** ([`src/atoms/`](../../src/atoms/), [`useFilterAtoms`](../../src/hooks/useFilterAtoms.hook.ts) / [`useViewAtoms`](../../src/hooks/useViewAtoms.hook.ts)) | Duplicating filter state in context |
| OAuth session, theme, collection **pagination metadata** | **Context + `useReducer`** | Jotai for session lifecycle |
| Crates/playlists/prefs/release detail from the server | **React Query** hooks in [`src/hooks/queries/`](../../src/hooks/queries/) + mutations in [`src/hooks/mutations/`](../../src/hooks/mutations/) | Raw `fetch` in components |
| Crate drawer, active crate, layout mutations | **`CrateProvider`** + React Query | Local crate copies without invalidation |
| Many subscribers to UI-only derived state | **Jotai atoms** | New context for every toggle |
| Persisted filter/view prefs on the client | **`atomWithStorage`** + keys in [`storageKeys.ts`](../../src/constants/storageKeys.ts) | Ad-hoc `localStorage` keys |

Details: [patterns.md → Provider stack](patterns.md#provider-stack), [architecture.md → Client state](architecture.md#tech-stack).

## App Router and components

| If you need… | Use | Not |
| ------------ | --- | --- |
| Route metadata, static shells | Thin server **`page.tsx`** | Business logic in server page |
| Interactive collection/crate/playback UI | Co-located **`*Client.tsx`** static-imported from `page.tsx` | `next/dynamic` on core `*Client` chunks (Turbopack dev breakage) |
| Loading UI during navigation | Segment **`loading.tsx`** + shared loaders | Client-only spinners that fight PPR |
| Pathname only on click (e.g. support toast) | **`window.location.pathname`** in the handler | **`usePathname`** at render when avoidable |
| New component folder | **`pnpm scaffold <Name>`** | Hand-authored folder trees |

Details: [architecture.md](architecture.md), [components.md](components.md), [platform.md → PPR](platform.md).

## API and server

| If you need… | Use | Not |
| ------------ | --- | --- |
| Browser calls our App Router APIs | **`api.*`** in [`src/api/urls.ts`](../../src/api/urls.ts) | Inline `/api/...` strings in components |
| New authenticated JSON response | **`privateRouteJson`** / **`createErrorResponse`** | Ad-hoc `Response.json` shapes |
| Request body/query validation on routes | Zod in [`src/lib/validation/`](../../src/lib/validation/) + [`parseRequestBody`](../../src/lib/validation/parseRequestBody.ts) | Inline validation in the handler |
| Discogs upstream calls | [`discogs-oauth.service.ts`](../../src/services/discogs-oauth.service.ts) | Unsigned `fetch` to Discogs |
| Username validation in routes | **`isValidDiscogsUsername`** | Copy-paste regex |

Details: [api-routes.md](api-routes.md), [database.md → API routes](database.md#api-routes), [discogs.md](discogs.md).

## Testing: which layer

| If you are testing… | Prefer | Avoid |
| ------------------- | ------ | ----- |
| Component UI + interactions | **`<Name>.spec.tsx`** + **`<Name>.po.tsx`** (mocks in PO) | `mockApiResponse` inside `.spec.tsx` |
| Hook behavior (queries/mutations bypassed) | **`* .hook.spec.ts`** — mock **`api.*`** in `beforeEach`, flat **`describe`** | Mocking files under `src/hooks/queries/` |
| Pure merge/sort/cache logic | **`src/utils/*.spec.ts`** first (TDD) | Heavy logic only in hook specs |
| App Route Handler | Co-located **`route.spec.ts`** | Component test as API substitute |
| Playback queue / embed contract | Themed **`releasePlayback.context.*.spec.tsx`** + [playback-embed-invariants.md](playback-embed-invariants.md) | One giant playback spec |
| Full browser journey | **Playwright** under `e2e/` with MSW fixture | Duplicating E2E logic in Jest |

Details: [conventions.md → Non-negotiables](conventions.md#non-negotiables-substantive-work-and-agents), [conventions.md → Testing](conventions.md#testing).

## Docs and agent finish

| If you changed… | Update |
| --------------- | ------ |
| Behavior, routes, hooks, tests patterns | Matching **`docs/handbook/*.md`** ([llms.md](llms.md)) |
| User-facing features, setup, tech stack in README | Root **[README.md](../../README.md)** |
| Storage, clear-data, privacy-relevant behavior | [data-storage.md](data-storage.md) + About/Legal copy |
| New `api.*` method or route shape | [api-routes.md](api-routes.md) and/or [database.md](database.md) |

Details: [agent-workflow.md](agent-workflow.md), [AGENTS.md](../../AGENTS.md).

## Public vs authenticated surfaces

| Surface | Playback | Crate/playlist data |
| ------- | -------- | ------------------- |
| Authenticated app (`/releases`, `/crates/…`) | [`AuthenticatedProvidersGate`](../../src/components/AuthenticatedProvidersGate.component.tsx) | Full OAuth + private APIs |
| Public share (`/crate/[id]`, `/playlist/[id]`, `/release/[id]`) | [`PublicSharePlaybackShell`](../../src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component.tsx) when logged out | Public GET routes + SSR helpers |
| Marketing (home, about, legal) | No global playback shell | N/A |

Details: [patterns.md → Public share vs authenticated app](patterns.md#public-share-vs-authenticated-app).

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

### New product analytics event

1. [platform.md](platform.md) semantic events — add helper in [`productAnalyticsEvents.ts`](../../src/analytics/productAnalyticsEvents.ts) only.
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
