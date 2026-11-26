## Non-negotiables (protect working playback)

Any radio PR must satisfy these; regression means **revert the radio diff**, not patch embed in place.

- Same **`startPlayback` / `playQueueItem`** path as modal collection play: enriched **`release.tracklist` / `release.videos`** from cache, **no** row `youtubeVideoId` override (playlist may still pass overrides where users curated them). Pass the shuffled **`startQueueItem`** into **`startPlayback`** so the first row keeps **`fromCollectionRadio`**. **`resolveQueueItemEmbedTracksVideos`** prefers enriched embed on the queue release over an empty same-instance session. Session **`isSameRelease`** for **`PLAY_QUEUE_ITEM`** follows **`isQueueItemReplayOfActiveSession`** (different track on the same instance is not “same release”), and **`RESOLVE_PENDING_TRACK`** runs before embed loading UI. Curated **`upcomingQueue`** uses **`resetPlaybackSkipState`** only (not **`forceEmbedReloadAfterUnavailableSkip`** — that flag is for skip-recovery **`playNext`**, not playlist/radio queue replace) — **no watchdog changes**.
- **No** `collectionRadioQueueStart`, **no** radio-only **`resetPlaybackSkipState`**, **no** `similarQueueFetchInFlight` / load-started logic changes for radio.
- **No** provider ref mirror (`collectionRadioActiveRef`) required for v1 — Jotai atom + optional queue row markers only.
- **Smoke before merge:** modal track play (scrubber moves, no stuck spinner), playlist start, collection radio start — unchanged embed behavior when radio code is absent from the diff.

