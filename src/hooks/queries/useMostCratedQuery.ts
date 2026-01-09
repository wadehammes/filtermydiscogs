import { useQuery } from "@tanstack/react-query";
import { fetchMostCratedReleases } from "src/api/helpers";
import type { MostCratedRelease } from "src/types/dashboard.types";

export function useMostCratedQuery(limit: number = 10) {
  return useQuery<MostCratedRelease[]>({
    queryKey: ["mostCrated", limit],
    queryFn: () => fetchMostCratedReleases(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
