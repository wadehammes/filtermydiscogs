import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { useAuth } from "src/context/auth.context";
import type { PublicPlaylistEngagementResponse } from "src/types/playlist.types";
import { patchPublicPlaylistShareStatsInQueryCache } from "src/utils/publicPlaylistShareStatsQueryCache";

const usePublicPlaylistEngagementMutation = (
  mutationFn: (playlistId: string) => Promise<PublicPlaylistEngagementResponse>,
) => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: (response, playlistId) => {
      patchPublicPlaylistShareStatsInQueryCache(
        queryClient,
        playlistId,
        response.shareStats,
        userId,
      );
    },
  });
};

export const useRecordPublicPlaylistViewMutation = () =>
  usePublicPlaylistEngagementMutation(api.recordPublicPlaylistView);

export const useRecordPublicPlaylistPlayMutation = () =>
  usePublicPlaylistEngagementMutation(api.recordPublicPlaylistPlay);
