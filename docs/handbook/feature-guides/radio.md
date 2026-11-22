# Collection radio

**Status:** Design locked for v1 — implement as a **single playlist-shaped stack** off `staging`. Supersedes open stacked PRs that touched playback provider embed paths (`#1372`–`#1374`).

## User-visible behavior (v1)

On the **desktop collection filters bar** (≥1024px), a **play** control appears when **any collection filter is applied** or a **saved filter view** is active. Pressing play:

1. Loads release details for the **filtered, sorted** collection (same order as the grid).
2. Builds a pool of **YouTube-matched tracks** across those releases.
3. **Shuffles** the pool.
4. Starts the first track and queues the rest — same UX contract as **playlist play** (progress, embed confirm, queue advance).

While collection radio is **actively playing**, the control shows **pause** and calls **`togglePlayback`**. **Crate radio** (crate drawer footer) is planned later; mirror playlist drawer play when added.

## Model (playlist parity)

Radio is **orchestration only**. It must not add embed, watchdog, or similar-tail lifecycle hooks.

```text
useCollectionRadioPlayback
  → fetchQuery(discogs release detail) per filtered release
  → shuffle playable rows with resolved youtubeVideoId per row
  → playback.clearQueue()
  → playback.startPlayback({
        release, trackPosition, trackTitle,
        rebuildAlbumQueue: false,
        upcomingQueue,
        youtubeVideoId,  // first track, same as usePlaylistPlayback
      })
  → collectionRadioActiveAtom = true   // UI chrome only
```

| Layer | Role | Non-goals |
| ----- | ---- | --------- |
| [`collectionRadioPlayback.ts`](../../src/utils/collectionRadioPlayback.ts) | Visibility, shuffle pool, `youtubeVideoId` on queue rows from Discogs videos | Provider, embed, similar fetch |
| [`useCollectionRadioPlayback.hook.ts`](../../src/hooks/useCollectionRadioPlayback.hook.ts) | Fetch, plan, one `startPlayback`, toasts, active atom | `collectionRadioQueueStart`, `preserveCollectionRadio`, provider-only APIs |
| [`CollectionRadioPlayButton`](../../src/components/CollectionRadioPlayButton/) + [`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx) | Entry UI, play/pause when `atom && isPlaying` | Queue or embed logic |
| **Playback provider (minimal)** | Clear `collectionRadioActiveAtom` on **`stopPlayback`** and on **any** `startPlayback` (modal/playlist clears radio chrome) | `resetPlaybackSkipState` for radio, `activateCollectionRadio` in `startPlayback`, similar fetch lifecycle changes |

### Similar-release tail

Supplying **`upcomingQueue`** already disables similar mode in existing **`startPlayback`**. **v1:** full shuffled pool is **up next** upfront — **no** radio tail fetch, **`useCollectionRadioQueue`**, or drawer “radio loading” state.

Optional later: **`fromCollectionRadio`** on rows for drawer copy only; **`maybeExtendQueueTail`** may no-op when the queue still has radio markers — **without** touching embed load/confirm guards.

## Non-negotiables (protect working playback)

Any radio PR must satisfy these; regression means **revert the radio diff**, not patch embed in place.

- Same **`startPlayback` / `playQueueItem`** path as [`usePlaylistPlayback`](../../src/hooks/usePlaylistPlayback.hook.ts), including **`youtubeVideoId`** on the starting track and on queue items where resolved.
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

- `collectionRadioPlayback.spec.ts` — visibility, shuffle, `youtubeVideoId` on items
- `useCollectionRadioPlayback.hook.spec.ts` — multi-release fetch, `clearQueue` + `startPlayback` args (mock playback)
- `CollectionRadioPlayButton.spec.tsx` — visibility, play, active `aria-pressed` (hook mocked)
- **No** new provider integration spec for radio unless it asserts **zero** change to embed confirm paths (prefer leaving provider untouched)

## Related handbook

- [playback.md](playback.md) — global queue and shells
- [patterns.md → Release playback queue](../patterns.md#release-playback-queue)
- [playback-manual-queue.md](../playback-manual-queue.md) — manual `upcomingQueue`