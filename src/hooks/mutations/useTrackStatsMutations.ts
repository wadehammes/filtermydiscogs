import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { useAuth } from "src/context/auth.context";
import {
  TopUserTracksQueryKeys,
  TrackStatsQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type {
  UserTrackRecordBody,
  UserTrackYoutubeOverrideBody,
} from "src/lib/validation/userTrack.schemas";
import { patchTrackStatsInQueryCache } from "src/utils/trackStatsQueryCache";

export const useRecordTrackEventMutation = () => {
  return useMutation({
    mutationFn: (body: UserTrackRecordBody) => api.recordTrackEvent(body),
    retry: false,
    meta: {
      invalidates: [TrackStatsQueryKeys.all(), TopUserTracksQueryKeys.all()],
    },
  });
};

export const useSaveTrackYoutubeOverrideMutation = () => {
  const queryClient = useQueryClient();
  const { state: authState } = useAuth();

  return useMutation({
    mutationFn: (body: UserTrackYoutubeOverrideBody) =>
      api.saveTrackYoutubeOverride(body),
    retry: false,
    onSuccess: (_data, variables) => {
      const userId = authState.userId;

      if (userId == null) {
        return;
      }

      patchTrackStatsInQueryCache(
        queryClient,
        userId,
        variables.track_key,
        (previous) => ({
          ...previous,
          youtube_id: variables.youtube_id,
        }),
      );
    },
  });
};
