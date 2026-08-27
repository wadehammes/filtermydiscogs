import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

export interface UseDiscogsReleaseQueryParams {
  releaseId: string;
  enabled?: boolean;
}

export const discogsReleaseQueryOptions = (releaseId: string) => ({
  queryKey: DiscogsReleaseQueryKeys.byId(releaseId),
  queryFn: () => api.discogsRelease(releaseId),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useDiscogsReleaseQuery = ({
  releaseId,
  enabled = false,
}: UseDiscogsReleaseQueryParams) => {
  return useQuery({
    ...discogsReleaseQueryOptions(releaseId),
    enabled: enabled && !!releaseId,
  });
};
