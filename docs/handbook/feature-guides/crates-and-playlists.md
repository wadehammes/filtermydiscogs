# Crates and playlists (Postgres)

## What users experience

- **Crates** are curated subsets of a Discogs collection (Postgres), with layout, public share links, and release snapshots in JSON.
- **Playlists** are ordered **tracks** (`UserTrack` rows), not just albums—each row points at a collection **instance** and optional YouTube override.
- Public playlists show vote counts when the viewer is not treated as owner; owners see edit flows on authenticated routes.

## Domain vocabulary

| Term | Meaning |
| ---- | ------- |
| **`instance_id`** | Discogs **collection folder item** id for a specific copy in someone’s collection—not the catalog release id. |
| **`discogs_release_id`** | Catalog **release** id on Discogs (shared across collectors). Stored on [`UserTrack`](../../../prisma/schema.prisma). |
| **`track_key`** | Stable primary key for a user’s track row across playlists. |
| **Snapshot (`release_data`)** | JSON blob shaped like [`DiscogsRelease`](../../../src/types/index.ts) saved on crate or playlist snapshot tables. |

Glossary: [glossary.md](../glossary.md).

## Moving parts

| Feature | Tables / modules |
| ------- | ---------------- |
| Crate membership | `crate_releases`, layout markers—[database.md](../database.md) |
| Playlist tracks | `playlist_tracks` → `user_tracks` |
| Public playlist art (fast path) | `playlist_release_snapshots`, plus owner `crate_releases.release_data` |
| Snapshot validation | [`toValidatedPublicPlaylistRelease`](../../../src/lib/release-data-validation.ts) |

## Decisions & rationale

### Store release JSON, not just image URLs

**Decision:** Snapshots store full validated release payloads (thumb + `cover_image` in `basic_information`), keyed by `(user_id, playlist_id, instance_id)` or crate equivalents.

**Why:**

- Public loaders already build `DiscogsRelease[]` for the client—same types as the collection grid.
- One validation path (`validateReleaseDataForStorage`) for crate and playlist persistence.
- Room for title/artist/tracklist without a second schema.

**Tradeoff:** Larger JSON; acceptable because snapshots are per **unique instance** on a playlist, not per track row (many tracks can share one instance).

### `UserTrack` holds playback metadata, not cover URLs

**Decision:** `UserTrack` stores `youtube_id`, titles, `discogs_release_id`, counts—not a dedicated `cover_image` column today.

**Why:** Covers are release-level; duplicating on every track row would denormalize without helping SSR (the public loader still maps by `instance_id` → release).

**Planned direction:** Backfill snapshot JSON (see [public-sharing.md](public-sharing.md)) rather than adding parallel URL columns unless a cross-feature requirement appears.

### Playlist snapshots override crate snapshots for the same instance

**Decision:** In [`loadPublicPlaylist`](../../../src/lib/public-playlist-load.server.ts), playlist snapshot rows replace crate rows in the merged map for that `instance_id`.

**Why:** Owner may refresh playlist-specific snapshot data without mutating the global crate export.

## Code snapshot: track row shape

```ts
// types/playlist.types.ts
export type PlaylistTrackRow = {
  track_key: string;
  instance_id: string;
  discogs_release_id: number | null;
  youtube_id: string | null;
  track_title: string;
  // ...
};
```

## Code snapshot: persist playlist snapshots (full hydration only)

```ts
// loadPublicPlaylist — after discogsHydration === "full"
void persistPlaylistReleaseSnapshots({
  userId: playlist.user_id,
  playlistId: playlist.id,
  releases,
}).catch((error) =>
  reportInfrastructureFailure("public_playlist", error, {
    operation: "persist_playlist_release_snapshots",
    playlistId: playlist.id,
  }),
);
```

Default `snapshotsOnly` skips this write on cached page loads—snapshots are warmed via backfill or owner flows instead.

## Code snapshot: resolving Discogs id for batch hydrate

```ts
// discogsReleaseArt.ts
export const resolveDiscogsReleaseIdForPlaylistTrack = (
  track: Pick<PlaylistTrackRow, "discogs_release_id">,
  crateSnapshot: DiscogsRelease | undefined,
): number | null => {
  if (track.discogs_release_id !== null && track.discogs_release_id > 0) {
    return track.discogs_release_id;
  }
  if (!crateSnapshot) {
    return null;
  }
  return parseReleaseId(crateSnapshot);
};
```

## Related reading

- [patterns.md → Playlists](../patterns.md#playlists)
- [database.md → Playlists](../database.md)
- [factories.md](../factories.md) for test data