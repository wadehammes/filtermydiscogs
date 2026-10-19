# Manual playback queue scenarios

Behavioral contract for **listener-curated upcoming queues** (`addToQueue`, **Add all to queue**, drawer **reorder**) vs **album-tail rebuilds** after release detail / pending track resolution. Implementation spans [`useReleasePlaybackQueueActions.hook.ts`](../../src/hooks/useReleasePlaybackQueueActions.hook.ts), [`useReleasePlaybackPendingResolution.hook.ts`](../../src/hooks/useReleasePlaybackPendingResolution.hook.ts), [`releasePlaybackPendingResolution.ts`](../../src/utils/releasePlaybackPendingResolution.ts), and embed guards in [`playbackSimilarQueueEmbedGuard.ts`](../../src/utils/playbackSimilarQueueEmbedGuard.ts). Broader queue UX lives in [patterns.md → Release playback queue](patterns.md#release-playback-queue).

**Primary regression suite:** [`releasePlayback.context.core.spec.tsx`](../../src/context/releasePlayback.context.core.spec.tsx) (search strings below). **Unit / hook:** [`releasePlaybackPendingResolution.spec.ts`](../../src/utils/releasePlaybackPendingResolution.spec.ts) (**`shouldApplyPendingAlbumQueueRebuild`**), [`useReleasePlaybackPendingResolution.hook.spec.ts`](../../src/hooks/useReleasePlaybackPendingResolution.hook.spec.ts), [`useReleasePlaybackQueueActions.hook.spec.ts`](../../src/hooks/useReleasePlaybackQueueActions.hook.spec.ts), [`playbackSimilarQueueEmbedGuard.spec.ts`](../../src/utils/playbackSimilarQueueEmbedGuard.spec.ts). **E2E (MSW + mock YouTube):** [`authenticated-manual-queue-playback.spec.ts`](../../e2e/authenticated-manual-queue-playback.spec.ts) ([`playbackQueue.ts`](../../e2e/helpers/playbackQueue.ts) helpers).

## Manual curation flags

| Ref / helper | Set when | Effect |
|--------------|----------|--------|
| **`queueManuallyExtendedRef`** | **`addToQueue`**, **`addPreviewToQueue`**, **`reorderQueue`**, restore with non-empty persisted queue | **`shouldApplyPendingAlbumQueueRebuild`** returns false — deferred **`RESOLVE_PENDING_TRACK`** must not replace curated upcoming |
| **`shouldRebuildAlbumQueueRef`** | Cleared on manual **`addToQueue`** / **`reorderQueue`**; album **`startPlayback`** when appropriate | Album-tail rebuild runs only when this stays true **and** manual flag is false |

## Queue curation (session)

| Scenario | Expected behavior | Context spec search string | E2E |
|----------|-------------------|----------------------------|-----|
| **`startPlayback`** on a track row with no prior manual adds | Upcoming rebuilds from playable album tail after clicked position | **`rebuilds the album queue when playback starts on a track`** | — |
| **`startPlayback`** after **`addToQueue`** / **Add all** | Plays clicked track; **preserves** curated upcoming (remove clicked row from upcoming if present) | **`preserves a manually built queue when play is clicked in another release modal`**, **`replaces the album queue when play is clicked without manual queue additions`** | — |
| **`addToQueue`** | Dedupes **`instanceId` + `trackPosition`**; sets manual flags; clears album rebuild intent | **`appends tracks to the queue without duplicates`**, **`addToQueue appends a manual queue item when auto-start does not run`** | [`authenticated-manual-queue-playback.spec.ts`](../../e2e/authenticated-manual-queue-playback.spec.ts) (card overlay adds) |
| **`reorderQueue`** (drawer) | Reorders upcoming only; **active track keeps playing**; manual flag set | **`reorders the queue without restarting the active track`** | Same E2E (**`reorderQueueDrawerItem`**) |
| **`clearQueue`** | Clears upcoming; active track **keeps playing**; suppresses similar tail until new playback / add | **`keeps the active track playing when the queue is cleared`**, **`queues without losing transport when adding after clearQueue while playback stays active`** | — |
| **`stopPlayback`** | Clears upcoming and session | **`clears the queue when playback stops`** | — |
| Persist manual upcoming | **`localStorage`** queue rows survive refresh when auth + collection ready | **`persists manual queue additions`**, **`restores a persisted upcoming queue after refresh`** | — |
| **`autoPlayOnQueueAdd: false`** | First add can queue silently (no mini player) | **`queues without starting playback when autoPlayOnQueueAdd is disabled`** | — |

## Pending resolution vs manual queue (regression focus)

| Scenario | Expected behavior | Context spec search string | E2E |
|----------|-------------------|----------------------------|-----|
| Release detail **still loading** when listener already **`addToQueue`** + **`reorderQueue`** | When detail resolves, **do not** run deferred album-tail rebuild; upcoming order unchanged | **`when release detail resolves after manual queue curation`** | Delayed **`GET /api/release/:id`** for album one + curate + reorder + **`expectNoPlaybackSkipReason`** (full suite; see E2E spec) |
| Same as above + embed already **audibly confirmed** on current upload | No spurious **`notifyPlaybackVideoLoadStarted`** reset → no embed-unavailable **skip** / **`playNext`** on current track | **`when release detail resolves after manual queue curation`** (watchdog advance) | Same E2E (no skip toast after watchdog settle) |
| Hook-level guard | **`shouldApplyPendingAlbumQueueRebuild`** false when **`queueManuallyExtended`** | — (unit) | — |
| Pending hook skips rebuild | **`useReleasePlaybackPendingResolution`** respects **`queueManuallyExtendedRef`** | **`useReleasePlaybackPendingResolution.hook.spec.ts`** (manual extended) | — |

## Embed guard (same committed upload)

| Scenario | Expected behavior | Spec |
|----------|-------------------|------|
| Repeat load-started while embed **confirmed** and **same committed `embedVideoId`** | Ignore load-started (no confirm reset, no watchdog re-arm) | **`playbackSimilarQueueEmbedGuard.spec.ts`** (**`shouldIgnoreConfirmedEmbedLoadStarted`**) |
| Provider wiring | Passes **`committedEmbedVideoId`** into guard | **`useReleasePlaybackProvider.hook.ts`** + context / hook specs above |

## UI gating (detail load and queue building)

| Surface | Behavior |
|---------|----------|
| **Release modal** | Track rows and playback actions render only after **`useReleaseModalReleaseDetailQuery`** succeeds; while loading, **`ReleaseTracklistSkeleton`** replaces the tracklist ([`ReleaseModalBody`](../../src/components/ReleaseModalBody/ReleaseModalBody.component.tsx)). |
| **Release card “Add to queue”** | **`useReleaseCardQueueAction`** **`fetchQuery`**s release detail before **`startPlayback`** / **`addToQueue`**; the overlay shows a spinner while fetching ([`ReleaseCardOverlayQueueAction`](../../src/components/ReleaseCard/ReleaseCardOverlayQueueAction.component.tsx)). |
| **Mini player queue badge** | **`isQueueBuilding`** is true while **`pendingTrackPosition !== null`** (active album detail still resolving) or similar-tail fetch runs — badge shows a spinner instead of the count ([`ReleaseMiniPlayer`](../../src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component.tsx)). |
| **Queue drawer reorder** | Reorder stays **enabled** while **`pendingTrackPosition`** is set so listeners can curate upcoming before detail lands (regression: **`when release detail resolves after manual queue curation`**). When **`isQueueBuilding`**, the drawer shows a short status line; drag handles are not locked. |

Provider invariants (**`queueManuallyExtendedRef`**, **`shouldApplyPendingAlbumQueueRebuild`**, embed load-started guard) remain the source of truth regardless of UI gating.

## E2E notes

- Requires **`NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED=1`** (CI **`pnpm build:e2e`**) so **`te2jJncBVG4`** confirms without real YouTube.
- **Desktop-only** tag — queue drawer reorder uses pointer drag on the dock (same as [`authenticated-playback-queue.spec.ts`](../../e2e/authenticated-playback-queue.spec.ts)).
- **Smoke** (`E2E_SMOKE=1`): long watchdog settle cases **`test.skip`** — same policy as [`authenticated-embed-watchdog.spec.ts`](../../e2e/authenticated-embed-watchdog.spec.ts) **`normal`** / **`delayed`** cases.
- Delayed release detail uses [`createE2eDelayedReleaseByIdHandler`](../../src/tests/msw/e2eReleaseHandlers.ts) — approximates slow first **`GET /api/release/:id`** after login; the exact “play before fetch returns” timing is owned by Jest context specs (iframe + deferred promise).

## Related embed / tail behavior

Similar-release tail extension respects **`queueManuallyExtendedRef`** (manual threshold, suppression after **`addToQueue`**) — see [patterns.md → Scope](patterns.md#release-playback-queue) and [`releasePlayback.context.similarQueue.spec.tsx`](../../src/context/releasePlayback.context.similarQueue.spec.tsx). Override-only rows while stats load — [playback-embed-invariants.md → Embed start watchdog](playback-embed-invariants.md#embed-start-watchdog-unavailable-skip).
