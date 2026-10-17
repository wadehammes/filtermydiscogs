# Playback embed invariants

Behavioral contract for **YouTube embed ↔ global queue** wiring. Implementation today spans [`useReleasePlaybackProvider.hook.ts`](../../src/hooks/useReleasePlaybackProvider.hook.ts), [`useReleasePlaybackYoutubeEmbed.hook.ts`](../../src/hooks/useReleasePlaybackYoutubeEmbed.hook.ts), and utils under **`releasePlayback*`** / **`playbackEmbed*`** / **`embedPlayback*`** — see [playback-embed-simplification.md](playback-embed-simplification.md) for the refactor stack.

**Primary regression suite:** [`releasePlayback.context.spec.tsx`](../../src/context/releasePlayback.context.spec.tsx) (flat **`describe`** — search the **`it`** titles below). **E2E:** [`authenticated-embed-watchdog.spec.ts`](../../e2e/authenticated-embed-watchdog.spec.ts), [`authenticated-release-playback.spec.ts`](../../e2e/authenticated-release-playback.spec.ts), [`authenticated-similar-queue-playback.spec.ts`](../../e2e/authenticated-similar-queue-playback.spec.ts) where noted.

## Queue advance and end detection

| Invariant | Context spec search string |
|-----------|----------------------------|
| **ENDED** / **infoDelivery** at-or-past-end calls **`playNext`** when upcoming rows exist | **`advances the queue when the YouTube embed reports playback ended`**, **`advances the queue when infoDelivery reports`**, **`advances the queue when embed infoDelivery reports playback ended`** |
| Same-upload advance does not restart the iframe unnecessarily | **`does not imperatively loadAndPlay on playNext when the playback iframe stays registered`** |
| Stale end signals during transition / grace do not advance or revert track | **`does not advance when a stale embed ended`**, **`when infoDelivery reports the prior upload at end during cross-release switch`**, **`when cross-release switch from pause is confirmed, a later ended on the new track does not revert`** |
| Empty queue + end → **`stopPlayback`** (or similar tail) | **`stops playback when an unavailable skip advances with an empty queue`** |

## Hidden tab and visibility

| Invariant | Context spec search string |
|-----------|----------------------------|
| Hidden tab poll detects end and advances | **`polls player state in a hidden tab`**, **`resolves the next playback video id immediately when advancing the queue in a hidden tab`** |
| Background **PAUSED** before **ENDED** must not stop hidden polling (queue still advances) | **`when the tab is hidden and transport pauses before end, background polling still advances the queue`** |
| Ignore embed pause → app pause during upload switch / loading / transition while hidden | **`ignores background-tab pause events`**, **`advances in a hidden tab after PiP closes`**, **`when cross-release switch from pause runs while the tab is hidden`** |
| Tab visible → sync layout + **`requestYoutubeEmbedPlaybackSync`** + gesture retries | **`syncs embed playback when the tab becomes visible again`**, **`requests player state when the document becomes visible during playback`** |
| Watchdog disarmed while tab hidden; re-arm after visible recovery when unconfirmed | **`does not run the embed watchdog skip while the tab stays hidden during embed load`**, **`does not run the embed watchdog skip after pausing in a hidden tab`** |

## Embed confirm and loading UI

| Invariant | Context spec search string |
|-----------|----------------------------|
| Confirm from **PLAYING** / **infoDelivery** / advancing **currentTime** after load gate | **`confirms embed playback from infoDelivery`**, **`confirms embed playback after the post-load PLAYING delay`**, **`when video UI loading starts from queue advance without imperative embed load`** |
| **Presentation-ready** / **onReady** runs **`confirmEmbedPlaybackIfAudible`** when transport is playing (not paused restore) — no blind confirm on same-video re-sync without audible embed signals | **`when presentation is ready while transport is playing`**, **`when YouTube posts onReady after load started`**; E2E **`mode=silent`** ([`authenticated-embed-watchdog.spec.ts`](../../e2e/authenticated-embed-watchdog.spec.ts)) |
| Loading cap dismisses spinner without breaking confirm gates / watchdog | **`when playNext upload plays after the video UI loading cap, embed watchdog does not skip`** |
| Stale **PLAYING** right after **loadVideoById** does not confirm | **`does not treat immediate stale PLAYING as confirmed`** |
| Initial presentation grace on first load / re-load | **`extends the first embed watchdog arm by initial presentation grace`**, **`re-applies initial presentation watchdog grace when a new embed load resets confirmation`** |

## Embed start watchdog (unavailable skip)

| Invariant | Context spec search string |
|-----------|----------------------------|
| Watchdog skips only when still unconfirmed after probes | **`before unavailable skip, requests embed playback sync once`**, **`silent embed contract: watchdog unavailable skip`** (pairs with E2E **`mode=silent`**) |
| Re-arm once while video UI loading before skip | **`re-arms the embed watchdog while video UI loading`** |
| Slow / coarse-pointer delays | **`waits for the slow-network watchdog delay`**, **`when coarse pointer and unknown connection`** |
| Override-only row: disarm until stats resolve | **`when override-only playback starts before track stats load`**, **`when the queue grows during user override playback`** |
| Similar tail fetch: disarm / re-arm policy | **`does not unavailable-skip confirmed playback while similar queue tail is loading`** (E2E similar queue) |
| **onError** terminal codes skip; grace ignores non-terminal during switch | **`skips and advances when YouTube posts onError`** (E2E **`mode=error`**) |

## Track switch, pause, and restore

| Invariant | Context spec search string |
|-----------|----------------------------|
| Pause from dock / embed UI sync | **`toggles paused state`**, **`syncs paused state when the YouTube embed reports pause`** |
| **playNext** / switch keeps loading until next upload plays | **`playNext keeps video UI loading until the advanced upload reports playing`**; **`ReleaseMiniPlayer`** **`loads the next video via postMessage when advancing tracks with the panel visible`** |
| Queue advance / video-switch detection uses **matched track** YouTube id (Discogs row), not embed-prefetched **`embedVideoId`** in **`activeVideoId`** | **`playNext keeps video UI loading`** + queue-action harness when **`embedVideoIdRef`** is ahead of **`matchedActiveVideoIdRef`** |
| **`PersistentYoutubeIframe`**: when target upload already loaded, skip **`notifyPlaybackVideoPresentationReady`** while **video UI loading** is active (prefetch + **`playNext`** must not clear the spinner early) | **`persistentYoutubeIframeVideoSwitch.spec.ts`** **`skips presentation ready when the upload is unchanged but video UI loading is active`** |
| Restore paused: no watchdog until resume | **`does not arm the embed watchdog while transport is paused after refresh restore`**, **`when restore same-video sync runs while paused, resuming still arms the embed watchdog`** |
| Start another track from pause (cross-release / same album) | **`when transport is paused`** (multiple **`it`** titles — modal / queue / preview / restore) |

## Overrides and presentation ids

| Invariant | Context spec search string |
|-----------|----------------------------|
| User **youtube_id** overrides Discogs match | **`prefers a user YouTube override`**, override / queue growth tests above |

## Mental model (target)

One **embed session** answers: *Which upload is loading? Is playback confirmed for queue purposes? Should we poll, arm the watchdog, or ignore embed PAUSE?* — see Phase 1+ in [playback-embed-simplification.md](playback-embed-simplification.md).
