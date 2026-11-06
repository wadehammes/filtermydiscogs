import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getRateLimitedRetryDelayMs,
  isTransientRateLimitError,
} from "src/api/apiFetchError";
import { api } from "src/api/urls";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

const RELEASE_DETAIL_MAX_RETRIES = 3;

export const DISCOGS_RELEASE_DETAIL_STALE_MS = 5 * 60 * 1000;
export const DISCOGS_RELEASE_DETAIL_GC_MS = 10 * 60 * 1000;

export interface UseDiscogsReleaseQueryParams {
  releaseId: string;
  enabled?: boolean;
  initialDiscogsReleaseDetail?: DiscogsReleaseDetail;
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
  initialDiscogsReleaseDetail,
}: UseDiscogsReleaseQueryParams) => {
  const hasInitialPayload =
    initialDiscogsReleaseDetail !== undefined &&
    String(initialDiscogsReleaseDetail.id) === releaseId;

  return useQuery({
    ...discogsReleaseQueryOptions(releaseId),
    enabled: enabled && !!releaseId,
    ...(hasInitialPayload
      ? {
          initialData: initialDiscogsReleaseDetail,
          initialDataUpdatedAt: 0,
        }
      : {}),
    refetchOnMount: !hasInitialPayload,
  });
};
