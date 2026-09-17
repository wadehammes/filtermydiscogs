# Refactor plan: Fallow health (playback + modal duplication)

Stacked PRs from [Fallow health](../handbook/platform.md) analysis (baseline score **77 B**, Mar 2026). After PR 1 dedupe on the working tree, **`fallow health --score`** reported **88 A** (hotspot deduction N/A without full health flags). Goal: lower complexity/duplication and close CRAP gaps without big-bang refactors.

**Git stack (`st`):** Prefer three layers on trunk **`staging`** — (1) **`09-17-modal-playback-dedupe`** refactor + hook split, (2) **`09-17-public-modal-body-tests`**, (3) **`09-17-image-proxy-route-tests`**. Drop empty **`09-17-modal-playback-hook-split`** if hook work merged into layer 1. See [platform.md → Stacked pull requests](../handbook/platform.md#stacked-pull-requests-st). One-shot publish (local terminal): **`./scripts/publish-modal-playback-stack.sh`** — Cursor agent commits are blocked by the repo hook that rejects **`Co-authored-by`** trailers.

## Principles

- **One PR = one reviewable theme**; merge in order (each branch rebases on the previous).
- **Tests before or with behavior** — especially API routes and `PublicReleaseModalBody` (0% line coverage today).
- Re-run **`pnpm test:coverage`** + **`pnpm exec fallow health --coverage coverage/coverage-final.json`** after each PR to confirm CRAP/score movement.

## Stack overview

| PR | Theme | Primary files | Fallow signal |
|----|--------|---------------|---------------|
| **1** | Shared playback index + modal tracklist section *(done)* | `useReleaseDetailPlaybackIndex`, `ReleaseModalPlaybackTracksSection`, `releasePlayback` helpers | dup `c77b3abb6f87acd9-r*` |
| **2** | Public modal test reachability + body spec *(done)* | `PublicReleaseModalBody.spec.tsx`, `PublicReleaseModalBody.po.tsx` | CRAP 756 on `PublicReleaseModalBody` |
| **3** | `GET /api/image-proxy` route tests *(done)* | `route.spec.ts` | CRAP 1122, complexity 33 |
| **4** | Split `useReleaseModalPlayback` *(done)* | `useReleaseModalReleaseDetailQuery`, `useReleaseModalPlaybackSelection`, `useReleaseModalPlaybackTrackActions`, `useReleaseModalPlaybackQueue` | cognitive 44, 398 LOC |
| **5** | Decompose hot hooks (optional, separate stacks) | `useReleasesClient`, `ReleaseMiniPlayer`, `BottomDrawer` | Fallow targets pri 22–16 |
| **6** | Consolidate modal playback shell *(done)* | `ReleaseModalPlaybackLoadError`, `ReleaseModalPlaybackTracksFromState` | dup `c77b3abb6f87acd9-r2` between bodies |

PRs **5–6** are independent of **1–4** once playback/modal duplication is gone.

---

## PR 1 — Shared playback index + tracklist section

**Why first:** Pure refactor, no user-visible change; removes the largest clone groups between `ReleaseModalBody` and `PublicReleaseModalBody` and dedupes memos in `ReleasePlaybackProvider`.

**Changes**

- `useReleaseDetailPlaybackIndex` — `flattenTracklist` + `buildReleasePlaybackMatchIndex` from release detail fields.
- `resolvePlayableTrackAtPosition` / `findPreviewVideoForTrackPosition` in `releasePlayback.ts` — shared guard/lookup for queue vs play handlers.
- `ReleaseModalPlaybackTracksSection` — shared fallback + tracklist + preview block (both modal bodies).

**Verification**

- `pnpm test -- useReleaseDetailPlaybackIndex releasePlayback ReleaseModalBody useReleaseModalPlayback`
- `pnpm exec fallow dupes --trace src/components/PublicReleaseModalBody/PublicReleaseModalBody.component.tsx:24` — expect smaller or zero cross-body clone.

---

## PR 2 — Public release modal tests

**Why second:** Fallow `--coverage-gaps` and Istanbul show **`PublicReleaseModalBody`** as untested; refactoring PR 1 without tests risks regressions on public crates.

**Changes**

- `PublicReleaseModalBody.spec.tsx` (+ PO if needed): loading spinner, error retry, tracklist with mocked `useReleaseModalPlayback` or full integration via `TestProviders` + release fetch mock (mirror `ReleaseModalBody.spec.tsx` patterns).
- Target: exercise the shared `ReleaseModalPlaybackTracksSection` from the public path.

**Verification**

- `PublicReleaseModalBody` CRAP drops in `fallow health --coverage`.
- Static gap count for `src/app/about/page.tsx` etc. unchanged (pages still optional).

---

## PR 3 — Image proxy route tests

**Why third:** Highest remaining CRAP on a single handler; pattern exists in `src/app/api/search/route.spec.ts`.

**Cases (minimum)**

- 400 missing `url`, invalid domain, URL too long
- Rate limit 429 (mock `checkIpRateLimit`)
- 502/413 paths with mocked `fetch` / `sharp`
- Happy path: allowlisted Discogs URL → image bytes + cache headers

**Verification**

- `GET` CRAP falls from **1122** toward tested moderate range.
- No production change unless tests expose a bug.

---

## PR 4 — Split `useReleaseModalPlayback`

**Why fourth:** Hook is 398 LOC / cognitive 44; index + section extraction must land first to avoid merge pain.

**Suggested extractions (in order)**

1. Query prefetch effect → `useReleaseModalReleaseDetailQuery` (or colocated helper).
2. Track vs preview queue handlers → `useReleaseModalTrackActions` using `resolvePlayableTrackAtPosition`.
3. Active/queued state → keep in main hook or `useReleaseModalPlaybackSelection`.

**Verification**

- Existing `useReleaseModalPlayback.hook.spec.tsx` green; no PO breakage.
- Fallow `useReleaseModalPlayback` cognitive under ~30 if feasible.

---

## PR 5 — Fallow “targets” (parallel tracks)

Pick **one file per PR**:

| Target | Effort | Notes |
|--------|--------|--------|
| `useReleasesClient.hook.ts` | medium | Hotspot + complexity; heavy test surface |
| `ReleaseMiniPlayer.component.tsx` | medium | 100% tested CRAP already; split UI vs state |
| `BottomDrawer.component.tsx` | medium | 5 fan-in; drawer shell vs content |
| `ReleaseCrateMenu.component.tsx` | medium | 6 render sites |
| `ComparativeGrowthCharts.component.tsx` | medium | CRAP **worse** with coverage (524) — add chart interaction tests while splitting |
| `releasePlayback.ts` `scorePreparedTrackVideoMatch` | high | Already 98% tested; split matcher only if readability wins |

---

## PR 6 — Modal body shell *(done)*

Shared **`ReleaseModalPlaybackLoadError`** and **`ReleaseModalPlaybackTracksFromState`** (typed with **`ReleaseModalPlaybackState`**) removed cross-body JSX duplication. Remaining differences are intentional:

- Private: `ReleaseNotesEditorProvider`, notes card, similar sidebar, **`ReleaseTracklistSkeleton`** loading.
- Public: full-body spinner loading, no notes.

Optional follow-up: dedupe PO **`setupMocks`** blocks between **`ReleaseModalBody.po.tsx`** and **`PublicReleaseModalBody.po.tsx`** (test-only clone).

---

## API / lib test backlog (Fallow coverage-gaps)

Not blocking playback work; batch by domain:

- **Auth:** `auth/callback`, `auth/discogs` (partially covered elsewhere)
- **Collection instances/fields:** nested instance routes
- **Admin / donate:** `admin/page`, `donate.ts` client
- **Lib:** `sanitizeError` (380 CRAP), `discogs-oauth.service` `executeAuthenticatedRequest`

Use existing `src/app/api/*/route.spec.ts` as templates; mock `getReadOnlyVerifiedUserFromRequest` / OAuth service consistently.

---

## Commands (repeat per PR)

```bash
pnpm test:coverage
pnpm exec fallow health --coverage coverage/coverage-final.json --score
pnpm exec fallow health --hotspots --targets -q
pnpm exec fallow dupes --trace src/components/ReleaseModal/useReleaseModalPlayback.hook.ts:169
pnpm fallow:audit   # optional before push
```

## Success criteria (stack complete)

- Health score **≥ 80** without coverage (`--score` **88 A** on working tree, Mar 2026); with coverage **78 B** (hotspot deduction returns).
- No cross-file clone between `PublicReleaseModalBody` and `ReleaseModalBody` for tracklist JSX *(PR 6)*.
- `image-proxy` route and modal playback hooks covered by specs; top CRAP drivers shift to `ComparativeGrowthCharts`, `scorePreparedTrackVideoMatch`, `ReleaseMiniPlayer`.
- `useReleaseModalPlayback` orchestrator ~113 LOC after hook split (was 398 LOC).
