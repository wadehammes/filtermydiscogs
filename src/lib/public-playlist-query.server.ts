import { prisma } from "src/lib/db";

const PUBLIC_PLAYLIST_SELECT = {
  user_id: true,
  id: true,
  name: true,
  username: true,
  private: true,
  created_at: true,
  updated_at: true,
} as const;

export type PublicPlaylistRow = {
  user_id: number;
  id: string;
  name: string;
  username: string | null;
  private: boolean;
  created_at: Date;
  updated_at: Date;
};

export const findPublicPlaylistById = async (
  playlistId: string,
): Promise<PublicPlaylistRow | null> => {
  const playlists = await prisma.playlist.findMany({
    where: {
      id: playlistId,
      private: false,
    },
    select: PUBLIC_PLAYLIST_SELECT,
    take: 2,
    orderBy: { updated_at: "desc" },
  });

  if (playlists.length > 1) {
    console.warn(
      JSON.stringify({
        event: "public_playlist_ambiguous_id",
        playlistId,
        matchCount: playlists.length,
      }),
    );
  }

  return playlists[0] ?? null;
};

export const findPublicPlaylistSummaryById = async (
  playlistId: string,
): Promise<{
  name: string;
  username: string | null;
  trackCount: number;
} | null> => {
  const playlist = await findPublicPlaylistById(playlistId);

  if (!playlist) {
    return null;
  }

  const trackCount = await prisma.playlistTrack.count({
    where: {
      user_id: playlist.user_id,
      playlist_id: playlist.id,
    },
  });

  return {
    name: playlist.name,
    username: playlist.username,
    trackCount,
  };
};
