## Tests (v1)

- `collectionRadioPlayback.spec.ts` — visibility, shuffle, enriched release rows
- `useCollectionRadioPlayback.hook.spec.ts` — multi-release fetch, `clearQueue` + `startPlayback` args (mock playback)
- `CollectionRadioPlayButton.spec.tsx` — visibility, hover tooltip copy, preparing/building spinners, play/pause (playback hook mocked in PO)
- [`releasePlayback.context.collectionRadio.spec.tsx`](../../src/context/releasePlayback.context.collectionRadio.spec.tsx) — real provider: prior album track → **`clearQueue` + `startPlayback`** with enriched **`startQueueItem` / `upcomingQueue`**; embed progress and no watchdog skip (same band as [`releasePlayback.context.embedConfirm.spec.tsx`](../../src/context/releasePlayback.context.embedConfirm.spec.tsx))
- `e2e/authenticated-collection-radio-playback.spec.ts` — MSW + mock iframe handoff (`@full-suite`)

