import { useQuery } from "@tanstack/react-query";
import { fetchMostCratedReleases } from "src/api/helpers";
import type { MostCratedRelease } from "src/types/dashboard.types";
import { MostCratedQueryKeys } from "./querykeys.constants";

export interface UseMostCratedQueryParams {
  limit?: number;
}

export const useMostCratedQuery = ({
  limit = 10,
}: UseMostCratedQueryParams = {}) => {
  return useQuery<MostCratedRelease[]>({
    queryKey: MostCratedQueryKeys.list(limit),
    queryFn: () => fetchMostCratedReleases(limit),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
