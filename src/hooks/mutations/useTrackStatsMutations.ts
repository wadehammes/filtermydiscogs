import { useMutation } from "@tanstack/react-query";
import { api } from "src/api/urls";
import {
  TopUserTracksQueryKeys,
  TrackStatsQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";

export const useRecordTrackEventMutation = () => {
  return useMutation({
    mutationFn: (body: UserTrackRecordBody) => api.recordTrackEvent(body),
    retry: false,
    meta: {
      invalidates: [TrackStatsQueryKeys.all(), TopUserTracksQueryKeys.all()],
    },
  });
};
