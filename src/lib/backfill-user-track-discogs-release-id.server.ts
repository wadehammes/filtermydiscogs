import "server-only";

import { prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { resolveDiscogsReleaseIdForPlaylistTrack } from "src/utils/discogsReleaseArt";

export const backfillDiscogsReleaseIdsForPlaylistTracks = async ({
  userId,
  tracks,
  crateSnapshotsByInstanceId,
}: {
  userId: number;
  tracks: PlaylistTrackRow[];
  crateSnapshotsByInstanceId: Map<string, DiscogsRelease>;
}): Promise<PlaylistTrackRow[]> => {
  const updates: { track_key: string; discogs_release_id: number }[] = [];

  const patchedTracks = tracks.map((track) => {
    if (track.discogs_release_id !== null && track.discogs_release_id > 0) {
      return track;
    }

    const snapshot = crateSnapshotsByInstanceId.get(String(track.instance_id));
    const discogsReleaseId = resolveDiscogsReleaseIdForPlaylistTrack(
      track,
      snapshot,
    );

    if (discogsReleaseId === null) {
      return track;
    }

    updates.push({
      track_key: track.track_key,
      discogs_release_id: discogsReleaseId,
    });

    return { ...track, discogs_release_id: discogsReleaseId };
  });

  if (updates.length === 0) {
    return patchedTracks;
  }

  await prisma.$transaction(
    updates.map(({ track_key, discogs_release_id }) =>
      prisma.userTrack.update({
        where: {
          user_id_track_key: { user_id: userId, track_key },
        },
        data: { discogs_release_id },
      }),
    ),
  );

  return patchedTracks;
};
