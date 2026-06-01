import { useQuery } from "@tanstack/react-query";
import { fetchDiscogsRelease } from "src/api/helpers";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

export interface UseDiscogsReleaseQueryParams {
  releaseId: string;
  enabled?: boolean;
}

export const useDiscogsReleaseQuery = ({
  releaseId,
  enabled = false,
}: UseDiscogsReleaseQueryParams) => {
  return useQuery({
    queryKey: DiscogsReleaseQueryKeys.byId(releaseId),
    queryFn: () => fetchDiscogsRelease(releaseId),
    enabled: enabled && !!releaseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
