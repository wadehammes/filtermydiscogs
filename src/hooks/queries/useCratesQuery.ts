import { useQuery } from "@tanstack/react-query";
import { fetchCrate, fetchCrates } from "src/api/helpers";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";

export interface UseCratesQueryParams {
  userId: string | null;
}

export const useCratesQuery = ({ userId }: UseCratesQueryParams) => {
  return useQuery<CratesResponse>({
    queryKey: CratesQueryKeys.byUserId(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      return fetchCrates();
    },
    enabled: !!userId,
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
}

export const useCrateQuery = ({ userId, crateId }: UseCrateQueryParams) => {
  const isEnabled = Boolean(userId && crateId);

  return useQuery<CrateWithReleasesResponse>({
    queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      if (!crateId) {
        throw new Error("Crate ID missing");
      }

      return fetchCrate(crateId);
    },
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
