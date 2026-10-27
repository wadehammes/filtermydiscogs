import type { QueryClient } from "@tanstack/react-query";
import {
  PlaylistQueryKeys,
  PublicPlaylistQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type {
  PlaylistDetail,
  PublicPlaylistResponse,
  PublicPlaylistShareStats,
} from "src/types/playlist.types";

export const patchPublicPlaylistShareStatsInQueryCache = (
  queryClient: QueryClient,
  playlistId: string,
  shareStats: PublicPlaylistShareStats,
  ownerUserId?: string | null,
): void => {
  queryClient.setQueryData<PublicPlaylistResponse>(
    PublicPlaylistQueryKeys.byId(playlistId),
    (previous) => (previous ? { ...previous, shareStats } : previous),
  );

  if (!ownerUserId) {
    return;
  }

  queryClient.setQueryData<PlaylistDetail>(
    PlaylistQueryKeys.byUserAndId(ownerUserId, playlistId),
    (previous) =>
      previous
        ? {
            ...previous,
            publicViewCount: shareStats.publicViewCount,
            publicPlayCount: shareStats.publicPlayCount,
          }
        : previous,
  );
};
