"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  collectionRadioActiveAtom,
  collectionRadioSessionReleaseIdsKeyAtom,
} from "src/atoms/collectionRadioPlayback.atoms";
import {
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { useSortedFilteredReleases } from "src/hooks/useFilterAtoms.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import { useHydrateDiscogsReleaseDetails } from "src/hooks/useHydrateDiscogsReleaseDetails.hook";
import {
  areCollectionRadioReleaseDetailsCached,
  buildReleaseDetailsFromQueryCache,
  collectCollectionRadioReleaseIds,
  planShuffledCollectionRadioStart,
  resolveIsCollectionRadioSelectionStale,
  shouldShowCollectionRadioPlayButton,
  shuffleCollectionRadioQueueFromDetails,
} from "src/utils/collectionRadioPlayback";
import { normalizeDiscogsReleaseIds } from "src/utils/discogsReleaseBatchCache";
import {
  showPlaybackQueueNoTracksToast,
  showPlaybackQueueSuccessToast,
} from "src/utils/playbackQueueToast";

export const useCollectionRadioPlayback = () => {
  const { startPlayback, clearQueue } = useReleasePlaybackActions();
  const { isPlaying, isPaused } = useReleasePlaybackState();
  const sortedReleases = useSortedFilteredReleases();
  const queryClient = useQueryClient();
  const { hasActiveFilters, matchingView } = useFilterViews();
  const [collectionRadioActive, setCollectionRadioActive] = useAtom(
    collectionRadioActiveAtom,
  );
  const [sessionReleaseIdsKey, setSessionReleaseIdsKey] = useAtom(
    collectionRadioSessionReleaseIdsKeyAtom,
  );
  const [isStarting, setIsStarting] = useState(false);

  const prefetchEnabled = shouldShowCollectionRadioPlayButton({
    hasActiveFilters,
    matchingViewActive: matchingView !== null,
  });

  const filteredReleaseIdsKey = useMemo(
    () =>
      normalizeDiscogsReleaseIds(
        collectCollectionRadioReleaseIds(sortedReleases).map(String),
      ).join("\0"),
    [sortedReleases],
  );

  const filteredReleaseIds = useMemo(
    () =>
      filteredReleaseIdsKey === "" ? [] : filteredReleaseIdsKey.split("\0"),
    [filteredReleaseIdsKey],
  );

  const releaseDetailsHydration = useHydrateDiscogsReleaseDetails({
    releaseIds: filteredReleaseIds,
    enabled: prefetchEnabled && filteredReleaseIds.length > 0,
  });

  const isDetailsReady =
    prefetchEnabled &&
    filteredReleaseIds.length > 0 &&
    releaseDetailsHydration.isSuccess &&
    areCollectionRadioReleaseDetailsCached(queryClient, sortedReleases);

  const isPrefetching =
    prefetchEnabled &&
    filteredReleaseIds.length > 0 &&
    !isDetailsReady &&
    (releaseDetailsHydration.isPending || releaseDetailsHydration.isFetching);

  const isCollectionRadioSession = collectionRadioActive;
  const isCollectionRadioTransportPlaying =
    collectionRadioActive && isPlaying && !isPaused;
  const isCollectionRadioSelectionStale =
    resolveIsCollectionRadioSelectionStale({
      isCollectionRadioSession,
      sessionReleaseIdsKey,
      currentReleaseIdsKey: filteredReleaseIdsKey,
    });

  const startCollectionRadio = useCallback(() => {
    if (isStarting || sortedReleases.length === 0) {
      if (sortedReleases.length === 0) {
        showPlaybackQueueNoTracksToast();
      }

      return;
    }

    if (!areCollectionRadioReleaseDetailsCached(queryClient, sortedReleases)) {
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

      clearQueue();
      startPlayback({
        release: plan.startItem.release,
        trackPosition: plan.startItem.trackPosition,
        trackTitle: plan.startItem.trackTitle,
        startQueueItem: plan.startItem,
        rebuildAlbumQueue: false,
        startPaused: false,
        upcomingQueue: plan.upcomingItems,
      });
      setCollectionRadioActive(true);
      setSessionReleaseIdsKey(filteredReleaseIdsKey);

      showPlaybackQueueSuccessToast(plan.upcomingItems.length + 1);
    } finally {
      setIsStarting(false);
    }
  }, [
    clearQueue,
    filteredReleaseIdsKey,
    isStarting,
    queryClient,
    setCollectionRadioActive,
    setSessionReleaseIdsKey,
    sortedReleases,
    startPlayback,
  ]);

  return {
    startCollectionRadio,
    isStarting,
    isPrefetching,
    isDetailsReady,
    filteredReleaseCount: sortedReleases.length,
    isCollectionRadioSession,
    isCollectionRadioTransportPlaying,
    isCollectionRadioSelectionStale,
  };
};
