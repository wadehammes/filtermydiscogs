import type { QueryClient } from "@tanstack/react-query";
import type { UserTrackStatsResponse } from "src/api/endpoints/tracks";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { UserTrackStatCounts } from "src/utils/userTrack";

export const mergeTrackStatsFromQueryCache = (
  queryClient: QueryClient,
  userId: string | number | null,
  cacheRevision?: string,
): Record<string, UserTrackStatCounts> => {
  void cacheRevision;
  if (userId == null) {
    return {};
  }

  const entries = queryClient.getQueriesData<UserTrackStatsResponse>({
    queryKey: TrackStatsQueryKeys.byUserId(userId),
  });

  const merged: Record<string, UserTrackStatCounts> = {};

  for (const [, data] of entries) {
    if (!data?.stats) {
      continue;
    }

    Object.assign(merged, data.stats);
  }

  return merged;
};

export const trackStatsCacheIncludesKeys = (
  stats: Record<string, UserTrackStatCounts>,
  trackKeys: readonly string[],
): boolean =>
  trackKeys.length > 0 && trackKeys.every((trackKey) => trackKey in stats);

export const isAwaitingTrackStatsForYoutubeOverride = ({
  isPlaying,
  userId,
  trackKey,
  resolvedOverrideId,
  stats,
}: {
  isPlaying: boolean;
  userId: string | number | null;
  trackKey: string | null;
  resolvedOverrideId: string | null | undefined;
  stats: Record<string, UserTrackStatCounts>;
}): boolean => {
  if (!isPlaying || userId == null || !trackKey) {
    return false;
  }

  if (resolvedOverrideId?.trim()) {
    return false;
  }

  return !trackStatsCacheIncludesKeys(stats, [trackKey]);
};

export const buildTrackStatsOverridesSnapshot = (
  stats: Record<string, UserTrackStatCounts>,
  trackKeys: readonly string[],
): string =>
  trackKeys
    .map((trackKey) => {
      const youtubeId = stats[trackKey]?.youtube_id?.trim() ?? "";
      return `${trackKey}\0${youtubeId}`;
    })
    .join("\n");

export const patchTrackStatsInQueryCache = (
  queryClient: QueryClient,
  userId: string | number,
  trackKey: string,
  patch: (previous: UserTrackStatCounts) => UserTrackStatCounts,
): void => {
  queryClient.setQueriesData<UserTrackStatsResponse>(
    { queryKey: TrackStatsQueryKeys.byUserId(userId) },
    (previous) => {
      if (!previous?.stats) {
        return previous;
      }

      const row = previous.stats[trackKey] ?? {
        play_count: 0,
        listen_count: 0,
        youtube_id: null,
      };

      return {
        stats: {
          ...previous.stats,
          [trackKey]: patch(row),
        },
      };
    },
  );
};
