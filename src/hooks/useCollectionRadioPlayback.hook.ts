"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { collectionRadioActiveAtom } from "src/atoms/collectionRadioPlayback.atoms";
import {
  useReleasePlayback,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useSortedFilteredReleases } from "src/hooks/useFilterAtoms.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import {
  buildReleaseDetailsFromQueryCache,
  planShuffledCollectionRadioStart,
  shouldShowCollectionRadioPlayButton,
  shuffleCollectionRadioQueueFromDetails,
} from "src/utils/collectionRadioPlayback";
import {
  showPlaybackQueueNoTracksToast,
  showPlaybackQueueSuccessToast,
} from "src/utils/playbackQueueToast";
import { parseReleaseId } from "src/utils/releaseNotes";

export const useCollectionRadioPlayback = () => {
  const playback = useReleasePlayback();
  const { isPlaying } = useReleasePlaybackState();
  const sortedReleases = useSortedFilteredReleases();
  const queryClient = useQueryClient();
  const { hasActiveFilters, matchingView } = useFilterViews();
  const [collectionRadioActive, setCollectionRadioActive] = useAtom(
    collectionRadioActiveAtom,
  );
  const [isStarting, setIsStarting] = useState(false);

  const prefetchEnabled = shouldShowCollectionRadioPlayButton({
    hasActiveFilters,
    matchingViewActive: matchingView !== null,
  });

  const releaseDetailQueries = useQueries({
    queries: prefetchEnabled
      ? sortedReleases.flatMap((release) => {
          const releaseId = parseReleaseId(release);

          if (releaseId === null) {
            return [];
          }

          return [discogsReleaseQueryOptions(String(releaseId))];
        })
      : [],
  });

  const isDetailsReady = useMemo(() => {
    if (!prefetchEnabled || sortedReleases.length === 0) {
      return false;
    }

    if (releaseDetailQueries.length === 0) {
      return false;
    }

    return releaseDetailQueries.every((query) => query.isSuccess);
  }, [prefetchEnabled, releaseDetailQueries, sortedReleases.length]);

  const isPrefetching =
    prefetchEnabled && releaseDetailQueries.some((query) => query.isFetching);

  const isCollectionRadioActive = collectionRadioActive && isPlaying;

  const startCollectionRadio = useCallback(() => {
    if (isStarting || sortedReleases.length === 0) {
      if (sortedReleases.length === 0) {
        showPlaybackQueueNoTracksToast();
      }

      return;
    }

    if (!isDetailsReady) {
      return;
    }

    setIsStarting(true);

    try {
      const releaseDetails = buildReleaseDetailsFromQueryCache(
        queryClient,
        sortedReleases,
      );

      if (!releaseDetails || releaseDetails.length === 0) {
        showPlaybackQueueNoTracksToast();
        return;
      }

      const shuffledQueue = shuffleCollectionRadioQueueFromDetails(
        sortedReleases,
        releaseDetails,
      );
      const plan = planShuffledCollectionRadioStart(shuffledQueue);

      if (!plan) {
        showPlaybackQueueNoTracksToast();
        return;
      }

      playback.clearQueue();
      playback.startPlayback({
        release: plan.startItem.release,
        trackPosition: plan.startItem.trackPosition,
        trackTitle: plan.startItem.trackTitle,
        rebuildAlbumQueue: false,
        startPaused: false,
        upcomingQueue: plan.upcomingItems,
      });
      setCollectionRadioActive(true);

      showPlaybackQueueSuccessToast(plan.upcomingItems.length + 1);
    } finally {
      setIsStarting(false);
    }
  }, [
    isDetailsReady,
    isStarting,
    playback,
    queryClient,
    setCollectionRadioActive,
    sortedReleases,
  ]);

  return {
    startCollectionRadio,
    isStarting,
    isPrefetching,
    isDetailsReady,
    filteredReleaseCount: sortedReleases.length,
    isCollectionRadioActive,
  };
};
