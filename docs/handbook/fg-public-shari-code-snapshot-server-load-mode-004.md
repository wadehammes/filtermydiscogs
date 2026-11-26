## Code snapshot: server load mode

```ts
// loadPublicPlaylist — discogsHydration branch
const discogsHydration = options?.discogsHydration ?? "snapshotsOnly";

const releases =
  discogsHydration === "snapshotsOnly"
    ? buildPublicPlaylistReleasesFromSnapshots({
        tracks,
        snapshotsByInstanceId: crateSnapshotsByInstanceId,
      })
    : await hydratePublicPlaylistReleases({
        tracks,
        crateSnapshotsByInstanceId,
      });
```

