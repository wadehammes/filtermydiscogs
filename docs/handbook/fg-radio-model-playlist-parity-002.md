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

