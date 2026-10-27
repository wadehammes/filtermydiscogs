import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "src/api/urls";
import type { PublicPlaylistResponse } from "src/types/playlist.types";
import { mergePublicPlaylistResponsePreservingLocalVotes } from "src/utils/publicPlaylistTrackVoteQueryCache";
import { PublicPlaylistQueryKeys } from "./querykeys.constants";

const PUBLIC_PLAYLIST_STALE_MS = 5 * 60 * 1000;
const PUBLIC_PLAYLIST_GC_MS = 10 * 60 * 1000;

export interface UsePublicPlaylistQueryParams {
  playlistId: string | null;
  initialPublicPlaylist?: PublicPlaylistResponse;
}

export const publicPlaylistQueryOptions = (playlistId: string | null) =>
  queryOptions({
    queryKey: PublicPlaylistQueryKeys.byId(playlistId),
    queryFn: async () => {
      if (!playlistId) {
        throw new Error("Playlist ID missing");
      }

      return api.publicPlaylist(playlistId);
    },
    enabled: Boolean(playlistId),
    staleTime: PUBLIC_PLAYLIST_STALE_MS,
    gcTime: PUBLIC_PLAYLIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

export const usePublicPlaylistQuery = ({
  playlistId,
  initialPublicPlaylist,
}: UsePublicPlaylistQueryParams) => {
  const queryClient = useQueryClient();
  const hasInitialPayload =
    initialPublicPlaylist !== undefined &&
    playlistId !== null &&
    initialPublicPlaylist.playlist.id === playlistId;

  const query = useQuery({
    ...publicPlaylistQueryOptions(playlistId),
    refetchOnMount: !hasInitialPayload,
    ...(hasInitialPayload
      ? {
          initialData: initialPublicPlaylist,
          initialDataUpdatedAt: Date.now(),
        }
      : {}),
  });

  useEffect(() => {
    if (!(hasInitialPayload && playlistId)) {
      return;
    }

    const queryKey = PublicPlaylistQueryKeys.byId(playlistId);

    void (async () => {
      const localBefore =
        queryClient.getQueryData<PublicPlaylistResponse>(queryKey);

      try {
        const serverData = await api.publicPlaylist(playlistId);
        queryClient.setQueryData<PublicPlaylistResponse>(
          queryKey,
          (current) => {
            const base = current ?? localBefore ?? serverData;
            return mergePublicPlaylistResponsePreservingLocalVotes(
              base,
              serverData,
            );
          },
        );
      } catch {}
    })();
  }, [hasInitialPayload, playlistId, queryClient]);

  return query;
};
