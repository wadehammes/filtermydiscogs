"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useState,
} from "react";
import { SIMILAR_RELEASES_LIMIT } from "src/constants/collection";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  appendUniqueQueueItems,
  collectQueueItemKeys,
  getQueueItemKey,
  shuffleQueueItems,
} from "src/utils/playbackQueue";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { getSimilarReleases } from "src/utils/similarReleases";

export const QUEUE_TAIL_EXTEND_THRESHOLD = 2;

export interface SimilarQueueMode {
  enabled: boolean;
  initialAppendPending: boolean;
}

export const createSimilarQueueMode = (enabled: boolean): SimilarQueueMode => ({
  enabled,
  initialAppendPending: enabled,
});

interface SimilarQueueRefs {
  queueRef: RefObject<PlaybackQueueItem[]>;
  previewVideoRef: RefObject<DiscogsVideo | null>;
  similarQueueModeRef: MutableRefObject<SimilarQueueMode>;
  similarQueueGenerationRef: MutableRefObject<number>;
  similarQueueFetchInFlightRef: MutableRefObject<boolean>;
}

interface UseReleasePlaybackSimilarQueueParams {
  queryClient: QueryClient;
  allReleases: DiscogsRelease[];
  updateUpcomingQueue: (
    updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[],
  ) => void;
  refs: SimilarQueueRefs;
}

export const useReleasePlaybackSimilarQueue = ({
  queryClient,
  allReleases,
  updateUpcomingQueue,
  refs,
}: UseReleasePlaybackSimilarQueueParams) => {
  const {
    queueRef,
    previewVideoRef,
    similarQueueModeRef,
    similarQueueGenerationRef,
    similarQueueFetchInFlightRef,
  } = refs;
  const [isSimilarQueueLoading, setIsSimilarQueueLoading] = useState(false);

  const fetchSimilarQueueItems = useCallback(
    async ({
      sourceRelease,
      existingQueue,
    }: {
      sourceRelease: DiscogsRelease;
      existingQueue: PlaybackQueueItem[];
    }): Promise<PlaybackQueueItem[]> => {
      const existingKeys = collectQueueItemKeys(existingQueue);
      const excludeInstanceIds = new Set(
        existingQueue.map((item) => item.instanceId),
      );
      let similarReleases = getSimilarReleases({
        releases: allReleases,
        sourceRelease,
        limit: SIMILAR_RELEASES_LIMIT,
        excludeInstanceIds,
      });

      if (similarReleases.length === 0) {
        similarReleases = getSimilarReleases({
          releases: allReleases,
          sourceRelease,
          limit: SIMILAR_RELEASES_LIMIT,
        });
      }

      const releaseQueues = await fetchPlayableQueuesForSimilarReleases({
        similarReleases,
        queryClient,
      });

      const similarItems: PlaybackQueueItem[] = [];

      for (const releaseQueue of releaseQueues) {
        for (const item of releaseQueue) {
          const itemKey = getQueueItemKey(item);

          if (!existingKeys.has(itemKey)) {
            similarItems.push(item);
            existingKeys.add(itemKey);
          }
        }
      }

      return shuffleQueueItems(similarItems);
    },
    [allReleases, queryClient],
  );

  const appendSimilarReleasesToQueue = useCallback(
    async ({
      sourceRelease,
      generation,
      existingQueue = queueRef.current,
    }: {
      sourceRelease: DiscogsRelease;
      generation: number;
      existingQueue?: PlaybackQueueItem[];
    }): Promise<boolean> => {
      if (similarQueueFetchInFlightRef.current) {
        return false;
      }

      similarQueueFetchInFlightRef.current = true;
      setIsSimilarQueueLoading(true);

      try {
        const similarItems = await fetchSimilarQueueItems({
          sourceRelease,
          existingQueue,
        });

        if (
          generation !== similarQueueGenerationRef.current ||
          similarItems.length === 0
        ) {
          return false;
        }

        updateUpcomingQueue((previousQueue) =>
          appendUniqueQueueItems(previousQueue, similarItems),
        );
        return true;
      } finally {
        similarQueueFetchInFlightRef.current = false;
        setIsSimilarQueueLoading(false);
      }
    },
    [
      fetchSimilarQueueItems,
      similarQueueFetchInFlightRef,
      similarQueueGenerationRef,
      updateUpcomingQueue,
    ],
  );

  const extendQueueTail = useCallback(async (): Promise<boolean> => {
    if (
      !similarQueueModeRef.current.enabled ||
      previewVideoRef.current !== null ||
      similarQueueFetchInFlightRef.current
    ) {
      return false;
    }

    const currentQueue = queueRef.current;
    const lastItem = currentQueue[currentQueue.length - 1];

    if (!lastItem) {
      return false;
    }

    return appendSimilarReleasesToQueue({
      sourceRelease: lastItem.release,
      generation: similarQueueGenerationRef.current,
      existingQueue: currentQueue,
    });
  }, [
    appendSimilarReleasesToQueue,
    previewVideoRef,
    queueRef,
    similarQueueFetchInFlightRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
  ]);

  const maybeExtendQueueTail = useCallback(() => {
    if (
      !similarQueueModeRef.current.enabled ||
      previewVideoRef.current !== null ||
      similarQueueModeRef.current.initialAppendPending ||
      similarQueueFetchInFlightRef.current
    ) {
      return;
    }

    const remainingTracks = queueRef.current.length;

    if (remainingTracks > QUEUE_TAIL_EXTEND_THRESHOLD) {
      return;
    }

    void extendQueueTail();
  }, [
    extendQueueTail,
    previewVideoRef,
    queueRef,
    similarQueueFetchInFlightRef,
    similarQueueModeRef,
  ]);

  return {
    appendSimilarReleasesToQueue,
    extendQueueTail,
    maybeExtendQueueTail,
    isSimilarQueueLoading,
  };
};
