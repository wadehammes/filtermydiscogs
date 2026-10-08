import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useTrackStatsQuery } from "src/hooks/queries/useTrackStatsQuery";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { getQueueItemKey } from "src/utils/playbackQueue";
import {
  buildTrackStatsOverridesSnapshot,
  mergeTrackStatsFromQueryCache,
  trackStatsCacheIncludesKeys,
} from "src/utils/trackStatsQueryCache";
import { normalizeTrackStatsKeys } from "src/utils/userTrack";

export const usePlaybackTrackYoutubeOverrides = ({
  userId,
  queue,
  additionalTrackKeys = [],
}: {
  userId: string | number | null;
  queue: readonly PlaybackQueueItem[];
  additionalTrackKeys?: readonly string[];
}): Map<string, string> => {
  const queryClient = useQueryClient();

  const trackKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const item of queue) {
      keys.add(getQueueItemKey(item));
    }

    for (const key of additionalTrackKeys) {
      keys.add(key);
    }

    const queueKeys = queue.map((item) => getQueueItemKey(item));

    return normalizeTrackStatsKeys([...keys], {
      prioritizeKeys: [...queueKeys, ...additionalTrackKeys],
    });
  }, [additionalTrackKeys, queue]);

  const subscribeToTrackStatsCache = useCallback(
    (onStoreChange: () => void) => {
      const cache = queryClient.getQueryCache();

      return cache.subscribe((event) => {
        if (
          event.type !== "updated" &&
          event.type !== "added" &&
          event.type !== "removed"
        ) {
          return;
        }

        if (event.query.queryKey[0] !== TrackStatsQueryKeys.all()[0]) {
          return;
        }

        onStoreChange();
      });
    },
    [queryClient],
  );

  const getTrackStatsCacheSnapshot = useCallback(() => {
    const stats = mergeTrackStatsFromQueryCache(queryClient, userId);
    const includesKeys = trackStatsCacheIncludesKeys(stats, trackKeys);

    if (!includesKeys) {
      return `missing:${trackKeys.join("\0")}`;
    }

    return buildTrackStatsOverridesSnapshot(stats, trackKeys);
  }, [queryClient, trackKeys, userId]);

  const cacheSnapshot = useSyncExternalStore(
    subscribeToTrackStatsCache,
    getTrackStatsCacheSnapshot,
    getTrackStatsCacheSnapshot,
  );

  const cacheSatisfiesKeys = !cacheSnapshot.startsWith("missing:");

  const cachedStats = useMemo(
    () => mergeTrackStatsFromQueryCache(queryClient, userId, cacheSnapshot),
    [cacheSnapshot, queryClient, userId],
  );

  const { data } = useTrackStatsQuery({
    userId,
    trackKeys,
    enabled: userId != null && trackKeys.length > 0 && !cacheSatisfiesKeys,
  });

  return useMemo(() => {
    const overrides = new Map<string, string>();
    const stats = cacheSatisfiesKeys ? cachedStats : data?.stats;

    if (!stats) {
      return overrides;
    }

    for (const [trackKey, row] of Object.entries(stats)) {
      const youtubeId = row.youtube_id?.trim();

      if (youtubeId) {
        overrides.set(trackKey, youtubeId);
      }
    }

    return overrides;
  }, [cacheSatisfiesKeys, cachedStats, data?.stats]);
};
