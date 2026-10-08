import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "src/api/urls";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import { normalizeTrackStatsKeys } from "src/utils/userTrack";

export const useTrackStatsQuery = ({
  userId,
  trackKeys,
  enabled = true,
}: {
  userId: string | number | null;
  trackKeys: string[];
  enabled?: boolean;
}) => {
  const normalizedKeys = useMemo(
    () => normalizeTrackStatsKeys(trackKeys),
    [trackKeys],
  );
  const keysSignature = [...normalizedKeys].sort().join("\0");

  return useQuery({
    queryKey: TrackStatsQueryKeys.byUserAndKeys(userId, keysSignature),
    queryFn: () => api.fetchTrackStats(normalizedKeys),
    enabled: enabled && userId != null && normalizedKeys.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
