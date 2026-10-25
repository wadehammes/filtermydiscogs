import "server-only";

import { backfillDiscogsReleaseIdsForPlaylistTracks } from "src/lib/backfill-user-track-discogs-release-id.server";
import { prisma } from "src/lib/db";
import { searchDiscogsDatabase } from "src/lib/discogs-consumer-search.server";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import {
  buildPlaylistTrackDiscogsSearchQuery,
  resolveDiscogsReleaseIdFromSearchResponse,
} from "src/utils/playlistTrackDiscogsSearch";

const MAX_DISCOGS_SEARCHES_PER_PLAYLIST_LOAD = 8;

const trackNeedsDiscogsReleaseId = (track: PlaylistTrackRow): boolean =>
  track.discogs_release_id === null || track.discogs_release_id <= 0;

export const backfillDiscogsReleaseIdsFromDiscogsSearch = async ({
  userId,
  tracks,
}: {
  userId: number;
  tracks: PlaylistTrackRow[];
}): Promise<PlaylistTrackRow[]> => {
  const tracksNeedingId = tracks.filter(trackNeedsDiscogsReleaseId);

  if (tracksNeedingId.length === 0) {
    return tracks;
  }

  const trackKeysByQuery = new Map<string, string[]>();

  for (const track of tracksNeedingId) {
    const query = buildPlaylistTrackDiscogsSearchQuery(track);

    if (!query) {
      continue;
    }

    const existing = trackKeysByQuery.get(query) ?? [];
    existing.push(track.track_key);
    trackKeysByQuery.set(query, existing);
  }

  const queries = [...trackKeysByQuery.keys()].slice(
    0,
    MAX_DISCOGS_SEARCHES_PER_PLAYLIST_LOAD,
  );

  const releaseIdByTrackKey = new Map<string, number>();

  for (const query of queries) {
    const response = await searchDiscogsDatabase({
      q: query,
      type: "release",
      per_page: "5",
    });
    const releaseId = resolveDiscogsReleaseIdFromSearchResponse(response);

    if (releaseId === null) {
      continue;
    }

    for (const trackKey of trackKeysByQuery.get(query) ?? []) {
      releaseIdByTrackKey.set(trackKey, releaseId);
    }
  }

  if (releaseIdByTrackKey.size === 0) {
    return tracks;
  }

  const updates = [...releaseIdByTrackKey.entries()].map(
    ([track_key, discogs_release_id]) => ({
      track_key,
      discogs_release_id,
    }),
  );

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

  return tracks.map((track) => {
    const releaseId = releaseIdByTrackKey.get(track.track_key);

    if (releaseId === undefined) {
      return track;
    }

    return { ...track, discogs_release_id: releaseId };
  });
};

export const backfillPlaylistTrackDiscogsReleaseIds = async ({
  userId,
  tracks,
  crateSnapshotsByInstanceId,
}: {
  userId: number;
  tracks: PlaylistTrackRow[];
  crateSnapshotsByInstanceId: Map<string, DiscogsRelease>;
}): Promise<PlaylistTrackRow[]> => {
  const fromCrates = await backfillDiscogsReleaseIdsForPlaylistTracks({
    userId,
    tracks,
    crateSnapshotsByInstanceId,
  });

  return backfillDiscogsReleaseIdsFromDiscogsSearch({
    userId,
    tracks: fromCrates,
  });
};
