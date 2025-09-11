import { useQuery } from "@tanstack/react-query";
import { fetchDiscogsRelease } from "src/api/helpers";

export const useDiscogsReleaseQuery = (
  releaseId: string,
  enabled: boolean = false,
) => {
  return useQuery({
    queryKey: ["discogsRelease", releaseId],
    queryFn: () => fetchDiscogsRelease(releaseId),
    enabled: enabled && !!releaseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
