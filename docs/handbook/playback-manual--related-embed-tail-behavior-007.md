## Related embed / tail behavior

Similar-release tail extension respects **`queueManuallyExtendedRef`** (manual threshold, suppression after **`addToQueue`**) — see [patterns.md → Scope](patterns.md#release-playback-queue) and [`releasePlayback.context.similarQueue.spec.tsx`](../../src/context/releasePlayback.context.similarQueue.spec.tsx). Override-only rows while stats load — [playback-embed-invariants.md → Embed start watchdog](playback-embed-invariants.md#embed-start-watchdog-unavailable-skip).

