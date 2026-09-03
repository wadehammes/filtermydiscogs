import {
  type QueryClient,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { ReleaseCrateMembershipResponse } from "src/types/crate.types";
import { ReleaseCrateMembershipQueryKeys } from "./querykeys.constants";

export const RELEASE_CRATE_MEMBERSHIP_STALE_MS = 60 * 1000;
export const RELEASE_CRATE_MEMBERSHIP_GC_MS = 5 * 60 * 1000;

export interface UseReleaseCrateMembershipQueryParams {
  userId: string | null;
  instanceId: string | null;
  enabled?: boolean;
}

export const releaseCrateMembershipQueryOptions = (
  userId: string | null,
  instanceId: string | null,
): UseQueryOptions<ReleaseCrateMembershipResponse> => {
  const normalizedInstanceId = instanceId ? String(instanceId) : null;

  return {
    queryKey: ReleaseCrateMembershipQueryKeys.byUserAndInstance(
      userId,
      normalizedInstanceId,
    ),
    queryFn: () => api.releaseCrateMembership(normalizedInstanceId as string),
    staleTime: RELEASE_CRATE_MEMBERSHIP_STALE_MS,
    gcTime: RELEASE_CRATE_MEMBERSHIP_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  };
};

export const prefetchReleaseCrateMembership = (
  queryClient: QueryClient,
  {
    userId,
    instanceId,
  }: Pick<UseReleaseCrateMembershipQueryParams, "userId" | "instanceId">,
) => {
  if (!(userId && instanceId)) {
    return Promise.resolve();
  }

  const options = releaseCrateMembershipQueryOptions(userId, instanceId);
  const state = queryClient.getQueryState(options.queryKey);

  if (state?.fetchStatus === "fetching") {
    return Promise.resolve();
  }

  return queryClient.prefetchQuery(options);
};

export const useReleaseCrateMembershipQuery = ({
  userId,
  instanceId,
  enabled = true,
}: UseReleaseCrateMembershipQueryParams) => {
  const normalizedInstanceId = instanceId ? String(instanceId) : null;
  const options = releaseCrateMembershipQueryOptions(userId, instanceId);

  return useQuery<ReleaseCrateMembershipResponse>({
    ...options,
    enabled: enabled && Boolean(userId && normalizedInstanceId),
  });
};
