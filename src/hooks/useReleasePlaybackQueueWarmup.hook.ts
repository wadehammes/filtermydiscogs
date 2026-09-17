"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { prefetchDiscogsReleaseQuery } from "src/utils/prefetchDiscogsReleaseQuery";
import { parseReleaseId } from "src/utils/releaseNotes";
import { getUpcomingQueueWarmupItems } from "src/utils/releasePlaybackQueueWarmup";

export const useReleasePlaybackQueueWarmup = ({
  queryClient,
  isPlaying,
  queue,
}: {
  queryClient: QueryClient;
  isPlaying: boolean;
  queue: PlaybackQueueItem[];
}): void => {
  const upcomingWarmupItems = useMemo(
    () => getUpcomingQueueWarmupItems(queue),
    [queue],
  );

  useEffect(() => {
    if (!isPlaying || upcomingWarmupItems.length === 0) {
      return;
    }

    const warmedReleaseIds = new Set<string>();

    for (const item of upcomingWarmupItems) {
      const releaseId = parseReleaseId(item.release);

      if (releaseId === null) {
        continue;
      }

      const releaseKey = String(releaseId);

      if (warmedReleaseIds.has(releaseKey)) {
        continue;
      }

      warmedReleaseIds.add(releaseKey);
      prefetchDiscogsReleaseQuery(queryClient, item.release);
    }
  }, [isPlaying, queryClient, upcomingWarmupItems]);
};
