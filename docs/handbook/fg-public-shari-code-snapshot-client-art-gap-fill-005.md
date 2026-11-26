## Code snapshot: client art gap fill

```ts
// usePublicPlaylistReleases.hook.ts (pattern)
const uniqueDiscogsReleaseIds =
  collectUniquePlaylistDiscogsReleaseIdsNeedingArtHydration(
    tracks,
    apiReleaseByInstanceId,
  );

const { data: hydratedReleaseDetails } = useHydrateDiscogsReleaseDetails({
  releaseIds: uniqueDiscogsReleaseIds,
  enabled: uniqueDiscogsReleaseIds.length > 0,
});
```

Row UI:

```tsx
// PublicPlaylistTrackItem — cover when release has URLs
const imageUrl = release
  ? resolveReleaseDisplayImageUrl(release) || null
  : null;
```

Missing URL → pulse placeholder via [`skeleton-pulse.module.css`](../../../src/styles/modules/skeleton-pulse.module.css) (see [components.md → Public pages](../components.md)).

