import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  discogsTransientProxyRetryDelay,
  discogsTransientProxyShouldRetry,
} from "src/api/apiFetchError";
import { api } from "src/api/urls";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

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
    retry: discogsTransientProxyShouldRetry,
    retryDelay: discogsTransientProxyRetryDelay,
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
