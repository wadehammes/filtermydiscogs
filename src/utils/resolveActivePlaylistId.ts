import type { PlaylistSummary } from "src/types/playlist.types";

export const resolveActivePlaylistId = ({
  playlists,
  activePlaylistId,
  lastPlayedPlaylistId = null,
}: {
  playlists: PlaylistSummary[];
  activePlaylistId: string | null;
  lastPlayedPlaylistId?: string | null;
}): string | null => {
  if (
    activePlaylistId &&
    playlists.some((playlist) => playlist.id === activePlaylistId)
  ) {
    return activePlaylistId;
  }

  if (
    lastPlayedPlaylistId &&
    playlists.some((playlist) => playlist.id === lastPlayedPlaylistId)
  ) {
    return lastPlayedPlaylistId;
  }

  return playlists[0]?.id ?? null;
};
