# Fall cleaning (Fallow + tests)

Living audit for high-value cleanup, spec hygiene, and coverage gaps. Re-run the commands below after major merges; update this doc when a phase lands.

## Fallow health (local)

```bash
pnpm fallow:health          # score + deductions
pnpm exec fallow health --hotspots --targets --format json --quiet  # full JSON
pnpm knip:ci                # dead exports / files (CI gate)
pnpm fallow:audit           # vs origin/staging (complexity regression)
```

**Snapshot (2026-11-14):** Health score **88 (A)**. Deductions: unit size (−10), coupling (−2.1), dead exports (−0.4). Knip and fallow audit **pass** on `staging`.

### Hotspots (change churn × complexity)

Prioritize review/refactor when touching these files:

| Rank | Path                                                               | Notes                                            |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------ |
| 1    | `src/hooks/useReleasePlaybackProvider.hook.ts`                     | Playback provider; largest fan-in to queue/embed |
| 2    | `src/hooks/useReleasePlaybackYoutubeEmbed.hook.ts`                 | Embed lifecycle                                  |
| 3    | `src/hooks/queries/querykeys.constants.ts`                         | High fan-in; keep changes narrow                 |
| 4    | `src/components/ReleasesClient/ReleasesClient.component.tsx`       | Collection shell                                 |
| 5    | `src/utils/releasePlayback.ts`                                     | Queue/session helpers                            |
| 6    | `src/components/ReleaseTracklist/ReleaseTracklist.component.tsx`   | Tracklist + playback actions                     |
| 7    | `src/lib/sentry/sentryInitOptions.ts`                              | Init surface                                     |
| 8    | `src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component.tsx` | Dock chrome                                      |

### Refactor targets (size / complexity)

Fallow `targets` (non-exhaustive): `ReleaseTracklist`, `ReleasesClient`, `BottomDrawer`, `useReleasesClient`, `useReleasePlaybackProvider`, `auth/clear-data` + `auth/logout` routes, `MobileReleaseCard`, `auth.service.ts`, `useReleasePlaybackQueueActions`.

**Large functions** cluster in playback hooks, `CrateLayoutList`, `useDraggablePanel`, `useCrateProvider`, `AdminDashboard`, `ReleasesTable`, `SettingsClient`.

Do **not** refactor hotspots for style alone; extract only when a change needs it or a bug fix requires smaller units.

## Istanbul gaps (<50% statements, ≥10 statements)

From `coverage/coverage-final.json` after a full `pnpm test:ci`:

| Coverage | Module                                                      | Action                                                    |
| -------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| ~5%      | `src/lib/db-audit.ts`                                       | Unit spec for ring buffer + delete audit (phase 3)        |
| ~8%      | `src/services/discogs-oauth.service.ts`                     | Extend `discogs-oauth.service.spec.ts` (network boundary) |
| ~11%     | `src/lib/user-profile-cache.ts`                             | Cache hit/miss with auth-request specs                    |
| ~14%     | `src/api/endpoints/dashboard.ts`                            | Route or client contract spec                             |
| ~17%     | `src/lib/public-crate.server.ts`                            | Server spec with Prisma/OAuth mocks                       |
| ~24%     | `src/lib/api-helpers.ts`                                    | Prefer focused `*.sanitizeError.spec.ts` pattern          |
| ~31%     | `src/utils/viewTransitionInterruptions.ts`                  | Util spec for navigation edge cases                       |
| ~32%     | `src/components/Dashboard/DashboardTrackItem.component.tsx` | PO spec for playback row behavior                         |
| ~46%     | `src/hooks/useDraggablePanel.hook.ts`                       | Hook spec for drag constraints                            |

## Test hygiene rules

From [conventions.md → Testing](handbook/conventions.md#testing):

1. **Thoughtful** — Assert DOM, API contracts, user flows; not render smoke or implementation trivia.
2. **One flat `describe`** per hook/util spec file (hook file = one top-level `describe`).
3. **Component specs** — PO owns `api.*` mocks; specs call `po.mock…()` only.
4. **Primitives** — Contract list in `src/tests/utils/requiredPrimitiveSpecs.spec.ts` (existence gate, not behavior).
5. **Feature specs** may smoke wiring only if a sibling test asserts real outcomes in the same file.

### Smoke-only patterns to fix or drop

| Spec                                   | Issue                         | Remedy                                    |
| -------------------------------------- | ----------------------------- | ----------------------------------------- |
| `PlaylistDrawer.spec.tsx`              | Root testId only              | Assert desktop shell + playlist selector  |
| `PlaylistDrawerTracks.spec.tsx`        | Root testId only              | Assert "No playlist selected" empty state |
| `PlaylistDrawerTrackItem.spec.tsx`     | Redundant with playback tests | Remove duplicate root-only case           |
| `PlaylistDrawerFooter.spec.tsx`        | Root smoke + good menu tests  | Drop root-only case                       |
| `PlaylistShareControls.spec.tsx`       | Root testId only              | Assert disabled switch or share copy      |
| `useSelectedReleaseModal.hook.spec.ts` | Three top-level `describe`s   | Split into one file per export            |

Many other `it("renders …")` cases are acceptable when the same file has interaction or contract tests (e.g. `ReleaseModal.spec.tsx`, `Login.spec.tsx`).

## Stacked PR plan

| Layer | Branch                        | Scope                                                           |
| ----- | ----------------------------- | --------------------------------------------------------------- |
| 1     | `fall-cleaning/audit`         | This doc + `.gitignore` for local Fallow dumps                  |
| 2     | `fall-cleaning/spec-hygiene`  | Hook split, playlist drawer spec upgrades, drop worthless smoke |
| 3     | `fall-cleaning/coverage-gaps` | `db-audit.spec.ts` and follow-ups from table above              |

## Commands for reviewers

```bash
st checkout fall-cleaning/audit   # or PR base chain
# Per-layer before push (handbook: conventions.md → Lint and format before commit):
pnpm lint:all
pnpm test:changed
mise run pr-prep   # lint:all + handbook:check + test:changed + fallow audit
```
