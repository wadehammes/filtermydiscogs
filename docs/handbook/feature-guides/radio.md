# Collection radio

## User-visible behavior

On the **desktop collection filters bar** (≥1024px), a **play** control with an animated theme gradient border appears when **any collection filter is applied** or a **saved filter view** is active. Pressing it starts playback on the **current filtered, sorted** releases: the first release in sort order that has playable YouTube-matched tracks, queued through that album. When the upcoming queue runs low, **collection radio** appends further filtered releases (marked `fromCollectionRadio` on queue rows). The **playback queue drawer** shows a status line while radio tail fetch runs and a passive banner while the radio session is active (distinct from **similar-release tail** copy).

**Crate radio** (play from crate layout order in the crate drawer footer) is planned and should mirror the playlist drawer play/queue pattern—not implemented yet.

## Moving parts

| Piece | Role |
| ----- | ---- |
| [`CollectionRadioPlayButton`](../../../src/components/CollectionRadioPlayButton/CollectionRadioPlayButton.component.tsx) | Visibility + gradient chrome; calls the playback hook |
| [`FiltersBar`](../../../src/components/StickyHeaderBar/FiltersBar.tsx) | Hosts the button beside **Saved views** |
| [`useFilterViews`](../../../src/hooks/useFilterViews.hook.ts) | `hasActiveFilters`, `matchingView` for visibility |
| [`useSortedFilteredReleases`](../../../src/hooks/useFilterAtoms.hook.ts) | Sort + filter order from Jotai |
| [`collectionRadioPlayback`](../../../src/utils/collectionRadioPlayback.ts) | Pure helpers: visibility, plan first album start |
| [`useCollectionRadioPlayback`](../../../src/hooks/useCollectionRadioPlayback.hook.ts) | Fetch release details, `startPlayback` + upcoming album tracks |

## Decisions & rationale

- **Desktop filters bar only** — matches where saved views and sort live; mobile uses the filters drawer (radio entry there can follow later).
- **First playable album in sort order** — reuses `buildFullPlayableAlbumQueue` and existing queue toasts; cross-album auto-advance through the full filtered set is a follow-up (similar to playlist tail extension).
- **Gradient border** — same conic `@property` rotation pattern as playlist hot-track emphasis, using theme `--primary` / `--link`.

## Tests

- `collectionRadioPlayback.spec.ts` — visibility + plan helpers
- `useCollectionRadioPlayback.hook.spec.ts` — fetch + `startPlayback`
- `CollectionRadioPlayButton.spec.tsx` — visibility + click (playback hook mocked)