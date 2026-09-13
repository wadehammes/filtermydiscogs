import { useQuery } from "@tanstack/react-query";
import {
  getRateLimitedRetryDelayMs,
  isTransientRateLimitError,
} from "src/api/apiFetchError";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "./querykeys.constants";

const RELEASE_DETAIL_MAX_RETRIES = 3;

export interface UseDiscogsReleaseQueryParams {
  releaseId: string;
  enabled?: boolean;
}

export const discogsReleaseQueryOptions = (releaseId: string) => ({
  queryKey: DiscogsReleaseQueryKeys.byId(releaseId),
  queryFn: () => api.discogsRelease(releaseId),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
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
