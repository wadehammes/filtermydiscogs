import {
  type QueryClient,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { api } from "src/api/urls";
import { isQueryKeyFetching } from "src/utils/queryPrefetchIfIdle";
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
) => {
  const normalizedInstanceId = instanceId ? String(instanceId) : null;

  return queryOptions({
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
  });
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

  if (isQueryKeyFetching(queryClient, options.queryKey)) {
    return Promise.resolve();
  }

  return queryClient
    .query(options)
    .then(() => undefined)
    .catch(() => undefined);
};

export const useReleaseCrateMembershipQuery = ({
  userId,
  instanceId,
  enabled = true,
}: UseReleaseCrateMembershipQueryParams) => {
  const normalizedInstanceId = instanceId ? String(instanceId) : null;
  const options = releaseCrateMembershipQueryOptions(userId, instanceId);

  return useQuery({
    ...options,
    enabled: enabled && Boolean(userId && normalizedInstanceId),
  });
};
