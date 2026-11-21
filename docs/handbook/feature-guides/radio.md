# Collection radio

**Status:** v1 implemented — playlist-parity `startPlayback`, minimal provider atom clear on stop/other starts. Supersedes closed stacked PRs `#1372`–`#1374`.

## User-visible behavior (v1)

On the **desktop collection filters bar** (≥1024px), a **play** control appears when **any collection filter is applied** or a **saved filter view** is active. Pressing play:

1. **Prefetch** release details while the control is visible (filters or saved view active) via React Query **`useQueries`**.
2. Enables **Play** only when every filtered release detail is **cached** (spinner + “Preparing…” until then).
3. On play, reads cache synchronously, shuffles the YouTube-matched pool, and calls **`startPlayback`** on the same click turn as playlist (no post-fetch gesture gap).
4. Starts the first track and queues the rest — same UX contract as **playlist play** (progress, embed confirm, queue advance).

While collection radio is **actively playing**, the control shows **pause** and calls **`togglePlayback`**. **Crate radio** (crate drawer footer) is planned later; mirror playlist drawer play when added.

### Entry control (desktop filters bar)

- **[`CollectionRadioPlayButton`](../../src/components/CollectionRadioPlayButton/)** — end of desktop **[`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx)** (`collectionRadioPlayEnd`); animated conic play/pause trigger, **`aria-pressed`** while radio is actively playing.
- **Tooltip** — copy from **`COLLECTION_RADIO_PLAY_TOOLTIP`** ([`collectionRadio.constants.ts`](../../src/constants/collectionRadio.constants.ts)); CSS module hover/focus bubble **below** the trigger (not above the sticky subheader) so it is not clipped; **`FiltersBar`** keeps **`overflow: visible`** on the desktop filters row/stack and the radio slot.
- **Preparing vs disabled** — while details prefetch, block clicks with **`aria-disabled="true"`** (and matching styles) but **without** native **`disabled`** so hover still shows the tooltip; use real **`disabled`** only for **building** (`isStarting`) or **zero playable rows**.

## Model (playlist parity)

Radio is **orchestration only**. It must not add embed, watchdog, or similar-tail lifecycle hooks.

```text
useCollectionRadioPlayback
  → useQueries(discogs release detail) while filters/view active
  → play disabled until all detail queries succeed
  → buildReleaseDetailsFromQueryCache → shuffle playable rows (release carries tracklist/videos)
  → playback.clearQueue()
  → playback.startPlayback({ … })   // sync on click, same as usePlaylistPlayback
  → collectionRadioActiveAtom = true   // UI chrome only
```

| Layer | Role | Non-goals |
| ----- | ---- | --------- |
| [`collectionRadioPlayback.ts`](../../src/utils/collectionRadioPlayback.ts) | Visibility, shuffle pool; **`tracklist` / `videos` on each queue `release`** from prefetched detail so `playQueueItem` resolves embed + active track on the click turn (no row-level `youtubeVideoId` override — modal/discogs-match path) | Provider, embed, similar fetch |
| [`useCollectionRadioPlayback.hook.ts`](../../src/hooks/useCollectionRadioPlayback.hook.ts) | Fetch, plan, one `startPlayback`, toasts, active atom | `collectionRadioQueueStart`, `preserveCollectionRadio`, provider-only APIs |
| [`CollectionRadioPlayButton`](../../src/components/CollectionRadioPlayButton/) + [`FiltersBar`](../../src/components/StickyHeaderBar/FiltersBar.tsx) | Entry UI, play/pause when `atom && isPlaying` | Queue or embed logic |
| **Playback provider (minimal)** | Clear `collectionRadioActiveAtom` on **`stopPlayback`** and on **any** `startPlayback` (modal/playlist clears radio chrome) | `resetPlaybackSkipState` for radio, `activateCollectionRadio` in `startPlayback`, similar fetch lifecycle changes |

### Similar-release tail

Supplying **`upcomingQueue`** already disables similar mode in existing **`startPlayback`**. **v1:** full shuffled pool is **up next** upfront — **no** radio tail fetch, **`useCollectionRadioQueue`**, or drawer “radio loading” state.

Optional later: **`fromCollectionRadio`** on rows for drawer copy only; **`maybeExtendQueueTail`** may no-op when the queue still has radio markers — **without** touching embed load/confirm guards.

## Non-negotiables (protect working playback)

Any radio PR must satisfy these; regression means **revert the radio diff**, not patch embed in place.

- Same **`startPlayback` / `playQueueItem`** path as modal collection play: enriched **`release.tracklist` / `release.videos`** from cache, **no** row `youtubeVideoId` override (playlist may still pass overrides where users curated them).
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
- **No** new provider integration spec for radio unless it asserts **zero** change to embed confirm paths (prefer leaving provider untouched)

## Related handbook

- [playback.md](playback.md) — global queue and shells
- [patterns.md → Release playback queue](../patterns.md#release-playback-queue)
- [playback-manual-queue.md](../playback-manual-queue.md) — manual `upcomingQueue`