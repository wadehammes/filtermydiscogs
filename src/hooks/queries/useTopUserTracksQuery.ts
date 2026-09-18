import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { TopUserTracksResponse } from "src/types/dashboard.types";
import { TopUserTracksQueryKeys } from "./querykeys.constants";

export interface UseTopUserTracksQueryParams {
  limit?: number;
}

export const useTopUserTracksQuery = ({
  limit = 10,
}: UseTopUserTracksQueryParams = {}) => {
  return useQuery<TopUserTracksResponse>({
    queryKey: TopUserTracksQueryKeys.list(limit),
    queryFn: () => api.topUserTracks(limit),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
