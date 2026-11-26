import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  discogsTransientProxyRetryDelay,
  discogsTransientProxyShouldRetry,
} from "src/api/apiFetchError";
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
    retry: discogsTransientProxyShouldRetry,
    retryDelay: discogsTransientProxyRetryDelay,
  });
};

export const useHydrateDiscogsReleaseDetails = ({
  releaseIds,
  enabled = true,
}: UseHydrateDiscogsReleaseDetailsParams) => {
  const queryClient = useQueryClient();
  const releaseIdsKey = useMemo(
    () => normalizeDiscogsReleaseIds(releaseIds).join("\0"),
    [releaseIds],
  );
  const normalizedIds = useMemo(
    () => (releaseIdsKey === "" ? [] : releaseIdsKey.split("\0")),
    [releaseIdsKey],
  );
  const options = useMemo(
    () => hydrateDiscogsReleaseDetailsQueryOptions(normalizedIds, queryClient),
    [normalizedIds, queryClient],
  );

  const placeholderData = useMemo(
    () => readDiscogsReleaseDetailsFromCache(queryClient, normalizedIds),
    [normalizedIds, queryClient],
  );

  return useQuery({
    ...options,
    enabled: enabled && normalizedIds.length > 0,
    ...(placeholderData.size > 0 ? { placeholderData } : {}),
  });
};
