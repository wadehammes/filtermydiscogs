import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";

export interface UseCratesQueryParams {
  userId: string | null;
  enabled?: boolean;
}

export const useCratesQuery = ({
  userId,
  enabled = true,
}: UseCratesQueryParams) => {
  return useQuery<CratesResponse>({
    queryKey: CratesQueryKeys.byUserId(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      return api.crates();
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
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

  return useQuery<CrateWithReleasesResponse>({
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
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
