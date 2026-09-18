import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";

export const useTrackStatsQuery = ({
  userId,
  trackKeys,
  enabled = true,
}: {
  userId: string | number | null;
  trackKeys: string[];
  enabled?: boolean;
}) => {
  const keysSignature = [...trackKeys].sort().join("\0");

  return useQuery({
    queryKey: TrackStatsQueryKeys.byUserAndKeys(userId, keysSignature),
    queryFn: () => api.fetchTrackStats(trackKeys),
    enabled: enabled && userId != null && trackKeys.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
