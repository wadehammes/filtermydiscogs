import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { CrateWithReleasesResponse } from "src/types/crate.types";
import { PublicCrateQueryKeys } from "./querykeys.constants";

export interface UsePublicCrateQueryParams {
  crateId: string | null;
}

export const usePublicCrateQuery = ({ crateId }: UsePublicCrateQueryParams) => {
  const isEnabled = Boolean(crateId);

  return useQuery<CrateWithReleasesResponse>({
    queryKey: PublicCrateQueryKeys.byId(crateId),
    queryFn: async () => {
      if (!crateId) {
        throw new Error("Crate ID missing");
      }

      return api.publicCrate(crateId);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
