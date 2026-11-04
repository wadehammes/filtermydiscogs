import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { DiscogsReleaseBatchQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  DISCOGS_RELEASE_DETAIL_GC_MS,
  DISCOGS_RELEASE_DETAIL_STALE_MS,
} from "src/hooks/queries/useDiscogsReleaseQuery";
import {
  fetchDiscogsReleaseDetailsIntoCache,
  normalizeDiscogsReleaseIds,
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
  const normalizedIds = normalizeDiscogsReleaseIds(releaseIds);

  return queryOptions({
    queryKey: DiscogsReleaseBatchQueryKeys.hydration(normalizedIds),
    queryFn: async () => {
      await fetchDiscogsReleaseDetailsIntoCache(queryClient, normalizedIds);
      return readDiscogsReleaseDetailsFromCache(queryClient, normalizedIds);
    },
    staleTime: DISCOGS_RELEASE_DETAIL_STALE_MS,
    gcTime: DISCOGS_RELEASE_DETAIL_GC_MS,
  });
};

export const useHydrateDiscogsReleaseDetails = ({
  releaseIds,
  enabled = true,
}: UseHydrateDiscogsReleaseDetailsParams) => {
  const queryClient = useQueryClient();
  const normalizedIds = useMemo(
    () => normalizeDiscogsReleaseIds(releaseIds),
    [releaseIds],
  );
  const options = useMemo(
    () => hydrateDiscogsReleaseDetailsQueryOptions(normalizedIds, queryClient),
    [normalizedIds, queryClient],
  );

  return useQuery({
    ...options,
    enabled: enabled && normalizedIds.length > 0,
  });
};
