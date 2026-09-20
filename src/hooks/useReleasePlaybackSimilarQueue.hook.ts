"use client";

import type { QueryClient } from "@tanstack/react-query";
import { type RefObject, useCallback, useState } from "react";
import { SIMILAR_RELEASES_LIMIT } from "src/constants/collection";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  appendUniqueQueueItems,
  buildCurrentQueueItem,
  collectQueueItemKeys,
  getQueueItemKey,
  resolveSimilarTailExtensionContext,
  shuffleQueueItems,
} from "src/utils/playbackQueue";
import { showSimilarQueueTailToast } from "src/utils/playbackQueueToast";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { getSimilarReleases } from "src/utils/similarReleases";

export const QUEUE_TAIL_EXTEND_THRESHOLD = 2;

export const MANUAL_QUEUE_TAIL_EXTEND_THRESHOLD = 1;

export const SIMILAR_QUEUE_TAIL_TRACK_LIMIT = 1;

export interface SimilarQueueMode {
  enabled: boolean;
}

export const createSimilarQueueMode = (enabled: boolean): SimilarQueueMode => ({
  enabled,
});

interface SimilarQueueRefs {
  queueRef: RefObject<PlaybackQueueItem[]>;
  previewVideoRef: RefObject<DiscogsVideo | null>;
  releaseRef: RefObject<DiscogsRelease | null>;
  tracksRef: RefObject<DiscogsTrack[]>;
  activeTrackIndexRef: RefObject<number>;
  similarQueueModeRef: RefObject<SimilarQueueMode>;
  similarQueueGenerationRef: RefObject<number>;
  similarQueueFetchInFlightRef: RefObject<boolean>;
  similarQueueTailToastShownRef: RefObject<boolean>;
  queueManuallyExtendedRef: RefObject<boolean>;
  extendQueueWithSimilarReleasesRef: RefObject<boolean>;
  similarQueueSuppressedAfterClearRef: RefObject<boolean>;
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
    releaseRef,
    tracksRef,
    activeTrackIndexRef,
    similarQueueModeRef,
    similarQueueGenerationRef,
    similarQueueFetchInFlightRef,
    similarQueueTailToastShownRef,
    queueManuallyExtendedRef,
    extendQueueWithSimilarReleasesRef,
    similarQueueSuppressedAfterClearRef,
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

      return shuffleQueueItems(similarItems).slice(
        0,
        SIMILAR_QUEUE_TAIL_TRACK_LIMIT,
      );
    },
    [allReleases, queryClient],
  );

  const appendSimilarReleasesToQueue = useCallback(
    async ({
      sourceRelease,
      generation,
      existingQueue,
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

      const queueSnapshot = existingQueue ?? queueRef.current;

      try {
        const similarItems = await fetchSimilarQueueItems({
          sourceRelease,
          existingQueue: queueSnapshot,
        });

        if (
          generation !== similarQueueGenerationRef.current ||
          similarItems.length === 0
        ) {
          return false;
        }

        const markedSimilarItems = similarItems.map((item) => ({
          ...item,
          fromSimilarRelease: true,
        }));

        let shouldShowSimilarTailToast = false;

        updateUpcomingQueue((previousQueue) => {
          const nextQueue = appendUniqueQueueItems(
            previousQueue,
            markedSimilarItems,
          );

          if (
            nextQueue.length > previousQueue.length &&
            !similarQueueTailToastShownRef.current
          ) {
            similarQueueTailToastShownRef.current = true;
            shouldShowSimilarTailToast = true;
          }

          return nextQueue;
        });

        if (shouldShowSimilarTailToast) {
          queueMicrotask(() => {
            showSimilarQueueTailToast();
          });
        }

        return true;
      } finally {
        similarQueueFetchInFlightRef.current = false;
        setIsSimilarQueueLoading(false);
      }
    },
    [
      fetchSimilarQueueItems,
      queueRef,
      similarQueueFetchInFlightRef,
      similarQueueGenerationRef,
      similarQueueTailToastShownRef,
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

    const playingRelease = releaseRef.current;
    const playingQueueItem =
      playingRelease === null
        ? null
        : buildCurrentQueueItem({
            release: playingRelease,
            previewVideo: previewVideoRef.current,
            activeTrack: tracksRef.current[activeTrackIndexRef.current] ?? null,
          });

    const tailContext = resolveSimilarTailExtensionContext({
      upcomingQueue: queueRef.current,
      playingRelease,
      playingQueueItem,
    });

    if (!tailContext) {
      return false;
    }

    return appendSimilarReleasesToQueue({
      sourceRelease: tailContext.sourceRelease,
      generation: similarQueueGenerationRef.current,
      existingQueue: tailContext.existingQueue,
    });
  }, [
    activeTrackIndexRef,
    appendSimilarReleasesToQueue,
    previewVideoRef,
    queueRef,
    releaseRef,
    similarQueueFetchInFlightRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
    tracksRef,
  ]);

  const maybeExtendQueueTail = useCallback(() => {
    if (
      previewVideoRef.current !== null ||
      similarQueueFetchInFlightRef.current ||
      similarQueueSuppressedAfterClearRef.current
    ) {
      return;
    }

    const remainingTracks = queueRef.current.length;
    const threshold = queueManuallyExtendedRef.current
      ? MANUAL_QUEUE_TAIL_EXTEND_THRESHOLD
      : QUEUE_TAIL_EXTEND_THRESHOLD;

    if (remainingTracks > threshold) {
      return;
    }

    if (queueRef.current.some((item) => item.fromSimilarRelease === true)) {
      return;
    }

    if (
      !similarQueueModeRef.current.enabled &&
      extendQueueWithSimilarReleasesRef.current
    ) {
      const canEnableSimilarTail =
        queueManuallyExtendedRef.current ||
        (releaseRef.current !== null && previewVideoRef.current === null);

      if (canEnableSimilarTail) {
        similarQueueModeRef.current = createSimilarQueueMode(true);
      }
    }

    if (!similarQueueModeRef.current.enabled) {
      return;
    }

    void extendQueueTail();
  }, [
    extendQueueTail,
    extendQueueWithSimilarReleasesRef,
    previewVideoRef,
    queueManuallyExtendedRef,
    queueRef,
    releaseRef,
    similarQueueFetchInFlightRef,
    similarQueueModeRef,
    similarQueueSuppressedAfterClearRef,
  ]);

  return {
    appendSimilarReleasesToQueue,
    extendQueueTail,
    maybeExtendQueueTail,
    isSimilarQueueLoading,
  };
};
