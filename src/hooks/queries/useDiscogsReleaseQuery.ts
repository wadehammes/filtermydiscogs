import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getRateLimitedRetryDelayMs,
  isTransientRateLimitError,
} from "src/api/apiFetchError";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

const RELEASE_DETAIL_MAX_RETRIES = 3;

export const DISCOGS_RELEASE_DETAIL_STALE_MS = 5 * 60 * 1000;
export const DISCOGS_RELEASE_DETAIL_GC_MS = 10 * 60 * 1000;

export interface UseDiscogsReleaseQueryParams {
  releaseId: string;
  enabled?: boolean;
}

export const discogsReleaseQueryOptions = (releaseId: string) =>
  queryOptions({
    queryKey: DiscogsReleaseQueryKeys.byId(releaseId),
    queryFn: () => api.discogsRelease(releaseId),
    staleTime: DISCOGS_RELEASE_DETAIL_STALE_MS,
    gcTime: DISCOGS_RELEASE_DETAIL_GC_MS,
    retry: (failureCount: number, error: unknown) =>
      isTransientRateLimitError(error) &&
      failureCount < RELEASE_DETAIL_MAX_RETRIES,
    retryDelay: (attemptIndex: number, error: unknown) =>
      getRateLimitedRetryDelayMs(error, attemptIndex),
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
