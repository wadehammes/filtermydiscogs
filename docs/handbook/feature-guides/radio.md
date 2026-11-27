# Collection radio

**Status:** v1 implemented — playlist-parity `startPlayback`, minimal provider atom clear on stop/other starts. Supersedes closed stacked PRs `#1372`–`#1374`.

## User-visible behavior (v1)

A **play** control appears when **any collection filter is applied** or a **saved filter view** is active **and at least one release matches** — on the **desktop filters bar** (≥1024px) and in the **mobile [`FiltersDrawer`](../../src/components/FiltersDrawer/FiltersDrawer.component.tsx)** footer (opened from the mobile menu). Pressing play:

1. **Prefetch** release details while the control is visible (filters or saved view active) via **[`useHydrateDiscogsReleaseDetails`](../../src/hooks/useHydrateDiscogsReleaseDetails.hook.ts)** — **one** React Query observer per filtered **release-id set**, batching uncached ids through **`/api/discogsReleaseBatch`** (**[`RELEASE_BATCH_MAX_IDS`](../../src/constants/collection.ts)** per chunk) instead of one HTTP call per release.
2. Enables **Play** only when every filtered release detail is **cached** (spinner + “Preparing…” until then).
3. On play, reads cache synchronously, shuffles the YouTube-matched pool, and calls **`startPlayback`** on the same click turn as playlist (no post-fetch gesture gap).
4. Starts the first track and queues the rest — same UX contract as **playlist play** (progress, embed confirm, queue advance).

While collection radio is **actively playing** (`collectionRadioActive` and transport not paused), the control shows **pause** and calls **`togglePlayback`**. When the user pauses from the mini player or the filter-bar control, the button shows **play** again (**Resume collection radio**) but still calls **`togglePlayback`** (does not restart the shuffle). If the user **changes filters** so the sorted filtered **release id set** no longer matches the set captured at **`startCollectionRadio`** (`collectionRadioSessionReleaseIdsKeyAtom` vs current `filteredReleaseIdsKey`), the control switches to **Restart collection radio** — **play** icon, updated tooltip, and **`startCollectionRadio`** on click (new shuffle; replaces the in-progress queue). While stale, pause/resume is not offered on this button (use the mini player to pause). Visual “radio mode” chrome (`playTriggerActive`) follows **`collectionRadioActiveAtom`** until stop, other **`startPlayback`**, or **`clearQueue`** — not transport `isPlaying`. **Prefetch / “Preparing…”** gates **new** starts and restarts; resume stays clickable while details refresh. **Crate radio** (crate drawer footer) is planned later; mirror playlist drawer play when added.

### Entry control (filters bar + mobile drawer)

- **[`CollectionRadioPlayButton`](../../src/components/CollectionRadioPlayButton/)** — end of desktop **[`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx)** (`collectionRadioPlayEnd`, icon-only + hover tooltip) and **footer** of **[`FiltersDrawer`](../../src/components/FiltersDrawer/FiltersDrawer.component.tsx)** (`collectionRadioSlot`, **`showLabel`** for visible play/prepare/restart copy on touch); animated conic play/pause trigger, **`aria-pressed`** while radio is actively playing.
- **Tooltip** — copy from **`COLLECTION_RADIO_PLAY_TOOLTIP`** ([`collectionRadio.constants.ts`](../../src/constants/collectionRadio.constants.ts)); CSS module **hover-only** bubble **below** the trigger (**not** **`:focus-within`** — the button keeps focus after click), **end-aligned** to the button; **`aria-describedby`** exposes the same copy to assistive tech. **`FiltersBar`** keeps **`overflow: visible`** on the desktop filters row/stack and the radio slot.
- **Preparing vs disabled** — while details prefetch, block clicks with **`aria-disabled="true"`** (and matching styles) but **without** native **`disabled`** so hover still shows the tooltip; use real **`disabled`** only for **building** (`isStarting`) or **zero playable rows**.

## Model (playlist parity)

Radio is **orchestration only**. It must not add embed, watchdog, or similar-tail lifecycle hooks.

```text
useCollectionRadioPlayback
  → useQueries(discogs release detail) while filters/view active (memoized id list)
  → play disabled until every detail query succeeds
  → buildReleaseDetailsFromQueryCache → shuffle playable rows (release carries tracklist/videos)
  → playback.clearQueue()
  → playback.startPlayback({ … })   // sync on click, same as usePlaylistPlayback
  → collectionRadioActiveAtom = true; collectionRadioSessionReleaseIdsKeyAtom = filteredReleaseIdsKey
```

| Layer | Role | Non-goals |
| ----- | ---- | --------- |
| [`collectionRadioPlayback.ts`](../../src/utils/collectionRadioPlayback.ts) | Visibility, shuffle pool; **`tracklist` / `videos` on each queue `release`** from prefetched detail so `playQueueItem` resolves embed + active track on the click turn (no row-level `youtubeVideoId` override — modal/discogs-match path). **`resolveQueueItemEmbedTracksVideos`** must prefer that enriched embed over an empty same-instance session when resolving the YouTube id. | Provider, embed, similar fetch |
| [`useCollectionRadioPlayback.hook.ts`](../../src/hooks/useCollectionRadioPlayback.hook.ts) | Fetch, plan, one `startPlayback`, toasts, active atom | `collectionRadioQueueStart`, `preserveCollectionRadio`, provider-only APIs |
| [`CollectionRadioPlayButton`](../../src/components/CollectionRadioPlayButton/) + [`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx) | Entry UI, play/pause when `atom && isPlaying` | Queue or embed logic |
| **Playback provider (minimal)** | **`useCollectionRadioActiveChrome`** inside **`useReleasePlaybackQueueActions`** clears `collectionRadioActiveAtom` on **`stopPlayback`**, **`clearQueue`**, and **any** `startPlayback` (modal/playlist clears radio chrome) | `resetPlaybackSkipState` for radio, `activateCollectionRadio` in `startPlayback`, similar fetch lifecycle changes |

### Similar-release tail

Supplying **`upcomingQueue`** already disables similar mode in existing **`startPlayback`**. **v1:** full shuffled pool is **up next** upfront — **no** radio tail fetch, **`useCollectionRadioQueue`**, or drawer “radio loading” state.

Optional later: **`fromCollectionRadio`** on rows for drawer copy only; **`maybeExtendQueueTail`** may no-op when the queue still has radio markers — **without** touching embed load/confirm guards.

## Non-negotiables (protect working playback)

Any radio PR must satisfy these; regression means **revert the radio diff**, not patch embed in place.

- Same **`startPlayback` / `playQueueItem`** path as modal collection play: enriched **`release.tracklist` / `release.videos`** from cache, **no** row `youtubeVideoId` override (playlist may still pass overrides where users curated them). Pass the shuffled **`startQueueItem`** into **`startPlayback`** so the first row keeps **`fromCollectionRadio`**. **`resolveQueueItemEmbedTracksVideos`** prefers enriched embed on the queue release over an empty same-instance session. Session **`isSameRelease`** for **`PLAY_QUEUE_ITEM`** follows **`isQueueItemReplayOfActiveSession`** (different track on the same instance is not “same release”), and **`RESOLVE_PENDING_TRACK`** runs before embed loading UI. Curated **`upcomingQueue`** uses **`resetPlaybackSkipState`** only (not **`forceEmbedReloadAfterUnavailableSkip`** — that flag is for skip-recovery **`playNext`**, not playlist/radio queue replace) — **no watchdog changes**.
- **No** `collectionRadioQueueStart`, **no** radio-only **`resetPlaybackSkipState`**, **no** `similarQueueFetchInFlight` / load-started logic changes for radio.
- **No** provider ref mirror (`collectionRadioActiveRef`) required for v1 — Jotai atom + optional queue row markers only.
- **Smoke before merge:** modal track play (scrubber moves, no stuck spinner), playlist start, collection radio start — unchanged embed behavior when radio code is absent from the diff.

## Non-goals (v1)

- Cross-release **tail** fetch while playing.
- Queue drawer autopopulate status lines for radio (similar vs radio CSS/messages).
- Changes to [`playback-embed-invariants.md`](../playback-embed-invariants.md) or watchdog/confirm paths **for radio**.

## Implementation stack (after sign-off)

| Layer | Contents |
| ----- | -------- |
| **One PR** (preferred) | Utils + hook + button + `FiltersBar` + atom + this guide + specs |
| **Optional follow-up** | Drawer copy only — not bundled with playback core |

Use **`gh stack`** off **`staging`**; do not revive the old `playback-core` / `filters-ui` / `queue-drawer` chain.

## Tests (v1)

- `collectionRadioPlayback.spec.ts` — visibility, shuffle, enriched release rows
- `useCollectionRadioPlayback.hook.spec.ts` — multi-release fetch, `clearQueue` + `startPlayback` args (mock playback)
- `CollectionRadioPlayButton.spec.tsx` — visibility, hover tooltip copy, preparing/building spinners, play/pause (playback hook mocked in PO)
- [`releasePlayback.context.collectionRadio.spec.tsx`](../../src/context/releasePlayback.context.collectionRadio.spec.tsx) — real provider: prior album track → **`clearQueue` + `startPlayback`** with enriched **`startQueueItem` / `upcomingQueue`**; embed progress and no watchdog skip (same band as [`releasePlayback.context.embedConfirm.spec.tsx`](../../src/context/releasePlayback.context.embedConfirm.spec.tsx))
- `e2e/authenticated-collection-radio-playback.spec.ts` — MSW + mock iframe handoff (`@full-suite`)

## Related handbook

- [playback.md](playback.md) — global queue and shells
- [patterns.md → Release playback queue](../patterns.md#release-playback-queue)
- [playback-manual-queue.md](../playback-manual-queue.md) — manual `upcomingQueue`