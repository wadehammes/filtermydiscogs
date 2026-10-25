import { backfillPlaylistTrackDiscogsReleaseIds } from "src/lib/backfill-user-track-discogs-release-id-search.server";
import { prisma } from "src/lib/db";
import { mapPlaylistTrackRow } from "src/lib/playlist-track-map.server";
import { hydratePublicPlaylistReleases } from "src/lib/public-playlist-discogs.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";
import { resolvePublicShareUsername } from "src/lib/public-share-username.server";
import {
  toPublicPlaylistReleaseSnapshot,
  validateReleaseDataForStorage,
} from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";
import type {
  PlaylistTrackRow,
  PublicPlaylistResponse,
} from "src/types/playlist.types";
import { buildPlaylistMosaicThumbUrls } from "src/utils/playlistMosaic";

const loadOwnerReleaseSnapshots = async (
  userId: number,
  instanceIds: string[],
): Promise<DiscogsRelease[]> => {
  if (instanceIds.length === 0) {
    return [];
  }

  const rows = await prisma.crateRelease.findMany({
    where: {
      user_id: userId,
      instance_id: { in: instanceIds },
    },
    orderBy: { added_at: "desc" },
    select: {
      instance_id: true,
      release_data: true,
    },
  });

  const byInstance = new Map<string, DiscogsRelease>();

  for (const row of rows) {
    if (byInstance.has(row.instance_id)) {
      continue;
    }

    const validated = validateReleaseDataForStorage(row.release_data);
    if (!("release" in validated)) {
      continue;
    }

    byInstance.set(
      row.instance_id,
      toPublicPlaylistReleaseSnapshot(validated.release),
    );
  }

  return instanceIds
    .map((id) => byInstance.get(id))
    .filter((release): release is DiscogsRelease => release !== undefined);
};

export const loadPublicPlaylist = async (
  playlistId: string,
): Promise<PublicPlaylistResponse | null> => {
  const playlist = await findPublicPlaylistById(playlistId);

  if (!playlist) {
    return null;
  }

  const trackRows = await prisma.playlistTrack.findMany({
    where: {
      user_id: playlist.user_id,
      playlist_id: playlist.id,
    },
    orderBy: { sort_order: "asc" },
    select: {
      sort_order: true,
      track_key: true,
      user_track: {
        select: {
          track_title: true,
          track_position: true,
          instance_id: true,
          artist: true,
          release_title: true,
          youtube_id: true,
          discogs_release_id: true,
        },
      },
    },
  });

  let tracks: PlaylistTrackRow[] = trackRows.map(mapPlaylistTrackRow);
  const instanceIds = [...new Set(tracks.map((track) => track.instance_id))];
  const crateSnapshots = await loadOwnerReleaseSnapshots(
    playlist.user_id,
    instanceIds,
  );
  const crateSnapshotsByInstanceId = new Map(
    crateSnapshots.map((release) => [String(release.instance_id), release]),
  );
  tracks = await backfillPlaylistTrackDiscogsReleaseIds({
    userId: playlist.user_id,
    tracks,
    crateSnapshotsByInstanceId,
  });
  const releases = await hydratePublicPlaylistReleases({
    tracks,
    crateSnapshotsByInstanceId,
  });
  const releaseByInstanceId = new Map(
    releases.map((release) => [String(release.instance_id), release]),
  );
  const mosaicThumbUrls = buildPlaylistMosaicThumbUrls({
    tracks,
    releaseByInstanceId,
  });

  const username = await resolvePublicShareUsername(
    playlist.user_id,
    playlist.username,
  );

  return {
    playlist: {
      id: playlist.id,
      name: playlist.name,
      username,
      private: playlist.private,
      created_at: playlist.created_at.toISOString(),
      updated_at: playlist.updated_at.toISOString(),
    },
    tracks,
    releases,
    mosaicThumbUrls,
  };
};
