import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";

const CRATES_LIST_STALE_MS = 5 * 60 * 1000;
const CRATES_LIST_GC_MS = 10 * 60 * 1000;
const CRATE_DETAIL_STALE_MS = 2 * 60 * 1000;
const CRATE_DETAIL_GC_MS = 5 * 60 * 1000;

export const cratesQueryOptions = (userId: string | null) =>
  queryOptions({
    queryKey: CratesQueryKeys.byUserId(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      return api.crates();
    },
    staleTime: CRATES_LIST_STALE_MS,
    gcTime: CRATES_LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

export const crateQueryOptions = (
  userId: string | null,
  crateId: string | null,
) =>
  queryOptions({
    queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      if (!crateId) {
        throw new Error("Crate ID missing");
      }

      return api.crate(crateId);
    },
    staleTime: CRATE_DETAIL_STALE_MS,
    gcTime: CRATE_DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

export interface UseCratesQueryParams {
  userId: string | null;
  enabled?: boolean;
}

export const useCratesQuery = ({
  userId,
  enabled = true,
}: UseCratesQueryParams) => {
  return useQuery({
    ...cratesQueryOptions(userId),
    enabled: enabled && !!userId,
  });
};

export interface UseCrateQueryParams {
  userId: string | null;
  crateId: string | null;
  enabled?: boolean;
}

export const useCrateQuery = ({
  userId,
  crateId,
  enabled = true,
}: UseCrateQueryParams) => {
  const isEnabled = enabled && Boolean(userId && crateId);

  return useQuery({
    ...crateQueryOptions(userId, crateId),
    enabled: isEnabled,
  });
};
