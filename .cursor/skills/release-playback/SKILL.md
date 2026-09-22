---
name: release-playback
description: >-
  Global playback queue, mini player, YouTube embed, ReleasePlaybackProvider.
  Use for playback hooks, dock, queue drawer, or modal track play.
---

# Release playback

Handbook: [patterns.md → Release playback queue](../../docs/handbook/patterns.md#release-playback-queue), [components.md → ReleasePlayback](../../docs/handbook/components.md#feature-example-releaseplayback).

## Architecture

- **`ReleasePlaybackProvider`** ([`ReleasePlaybackProvider.component.tsx`](../../src/context/ReleasePlaybackProvider.component.tsx)) — session reducer in [`playbackSessionState.ts`](../../src/utils/playbackSessionState.ts); side effects outside reducer.
- Split contexts: **`useReleasePlaybackState`**, **`useReleasePlaybackActions`**, queue/iframe hooks — prefer narrow subscriptions.
- **`GlobalPlaybackDock`** / **`ReleaseMiniPlayer`** — visible while **`isMiniPlayerVisible`** (`release !== null`), including paused.

## Queue

- **Up next** array only — current track = session fields, not queue[0].
- **`startPlayback`** vs manual **`addToQueue`** — handbook rules for preserving curated queue.
- Similar tail: **`preferences.extendQueueWithSimilarReleases`** (default off).

## Testing

- Sub-hooks: flat **`describe`**, mock **`api.*`** — [`useReleasePlaybackQueueActions.hook.spec.ts`](../../src/hooks/useReleasePlaybackQueueActions.hook.spec.ts), etc.
- Provider integration: [`releasePlayback.context.spec.tsx`](../../src/context/releasePlayback.context.spec.tsx) — do not duplicate full provider in every sub-hook file.

## UI entry

Track row in **`ReleaseModal`** → **`startPlayback`**; closing modal does **not** stop playback. Prefetch: **`useReleaseOpenHandler`** / card hover specs.
