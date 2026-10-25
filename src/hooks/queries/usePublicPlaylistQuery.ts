import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { PublicPlaylistResponse } from "src/types/playlist.types";
import { PublicPlaylistQueryKeys } from "./querykeys.constants";

export interface UsePublicPlaylistQueryParams {
  playlistId: string | null;
  initialPublicPlaylist?: PublicPlaylistResponse;
}

export const usePublicPlaylistQuery = ({
  playlistId,
  initialPublicPlaylist,
}: UsePublicPlaylistQueryParams) => {
  const isEnabled = Boolean(playlistId);
  const hasInitialPayload =
    initialPublicPlaylist !== undefined &&
    playlistId !== null &&
    initialPublicPlaylist.playlist.id === playlistId;

  return useQuery<PublicPlaylistResponse>({
    queryKey: PublicPlaylistQueryKeys.byId(playlistId),
    queryFn: async () => {
      if (!playlistId) {
        throw new Error("Playlist ID missing");
      }

      return api.publicPlaylist(playlistId);
    },
    enabled: isEnabled,
    ...(hasInitialPayload
      ? {
          initialData: initialPublicPlaylist,
          initialDataUpdatedAt: Date.now(),
        }
      : {}),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
