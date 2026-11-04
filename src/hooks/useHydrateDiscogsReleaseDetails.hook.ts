import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { DiscogsReleaseBatchQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  fetchDiscogsReleaseDetailsIntoCache,
  readDiscogsReleaseDetailsFromCache,
} from "src/utils/discogsReleaseBatchCache";

export interface UseHydrateDiscogsReleaseDetailsParams {
  releaseIds: readonly string[];
  enabled?: boolean;
}

export const hydrateDiscogsReleaseDetailsQueryOptions = (
  releaseIds: readonly string[],
  queryClient: QueryClient,
) => {
  const normalizedIds = [...new Set(releaseIds.map(String))].sort();

  return queryOptions({
    queryKey: DiscogsReleaseBatchQueryKeys.hydration(normalizedIds),
    queryFn: async () => {
      await fetchDiscogsReleaseDetailsIntoCache(queryClient, normalizedIds);
      return readDiscogsReleaseDetailsFromCache(queryClient, normalizedIds);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useHydrateDiscogsReleaseDetails = ({
  releaseIds,
  enabled = true,
}: UseHydrateDiscogsReleaseDetailsParams) => {
  const queryClient = useQueryClient();
  const normalizedIds = useMemo(
    () => [...new Set(releaseIds.map(String))].sort(),
    [releaseIds],
  );
  const options = hydrateDiscogsReleaseDetailsQueryOptions(
    normalizedIds,
    queryClient,
  );

  return useQuery({
    ...options,
    enabled: enabled && normalizedIds.length > 0,
  });
};
