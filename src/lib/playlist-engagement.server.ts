import { prisma } from "src/lib/db";
import { isPublicPlaylistOwnerViewer } from "src/lib/playlist-public-viewer.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";
import type { PublicPlaylistShareStats } from "src/types/playlist.types";

export const mapPlaylistEngagementCounts = (row: {
  public_view_count: number;
  public_play_count: number;
}): PublicPlaylistShareStats => ({
  publicViewCount: row.public_view_count,
  publicPlayCount: row.public_play_count,
});

type PublicEngagementField = "public_view_count" | "public_play_count";

const recordPublicPlaylistEngagement = async (
  playlistId: string,
  field: PublicEngagementField,
  viewerUserId?: number | null,
): Promise<PublicPlaylistShareStats | null> => {
  const playlist = await findPublicPlaylistById(playlistId);

  if (!playlist) {
    return null;
  }

  if (isPublicPlaylistOwnerViewer(playlist.user_id, viewerUserId)) {
    return mapPlaylistEngagementCounts(playlist);
  }

  const updated = await prisma.playlist.update({
    where: {
      user_id_id: { user_id: playlist.user_id, id: playlist.id },
    },
    data: {
      [field]: { increment: 1 },
    },
    select: {
      public_view_count: true,
      public_play_count: true,
    },
  });

  return mapPlaylistEngagementCounts(updated);
};

export const getPublicPlaylistShareStats = async (
  playlistId: string,
): Promise<PublicPlaylistShareStats | null> => {
  const playlist = await findPublicPlaylistById(playlistId);

  if (!playlist) {
    return null;
  }

  return mapPlaylistEngagementCounts(playlist);
};

export const recordPublicPlaylistView = (
  playlistId: string,
  viewerUserId?: number | null,
): Promise<PublicPlaylistShareStats | null> =>
  recordPublicPlaylistEngagement(playlistId, "public_view_count", viewerUserId);

export const recordPublicPlaylistPlay = (
  playlistId: string,
  viewerUserId?: number | null,
): Promise<PublicPlaylistShareStats | null> =>
  recordPublicPlaylistEngagement(playlistId, "public_play_count", viewerUserId);
