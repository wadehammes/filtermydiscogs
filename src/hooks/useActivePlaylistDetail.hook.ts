"use client";

import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { useAuth } from "src/context/auth.context";
import { usePlaylistQuery } from "src/hooks/queries/usePlaylistsQuery";

export const useActivePlaylistDetail = () => {
  const { activePlaylistId } = usePlaylistDrawerContext();
  const {
    state: { userId },
  } = useAuth();

  return usePlaylistQuery({
    userId,
    playlistId: activePlaylistId,
    enabled: Boolean(activePlaylistId),
  });
};
