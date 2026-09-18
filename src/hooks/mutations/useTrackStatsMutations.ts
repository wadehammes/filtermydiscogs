import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import {
  TopUserTracksQueryKeys,
  TrackStatsQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";

export const useRecordTrackEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UserTrackRecordBody) => api.recordTrackEvent(body),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TrackStatsQueryKeys.all(),
      });
      void queryClient.invalidateQueries({
        queryKey: TopUserTracksQueryKeys.all(),
      });
    },
  });
};
