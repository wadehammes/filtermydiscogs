"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { collectionRadioSessionAtom } from "src/atoms/collectionRadioPlayback.atoms";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useSortedFilteredReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import {
  createCollectionRadioSession,
  planCollectionRadioStartFromDetail,
} from "src/utils/collectionRadioPlayback";
import {
  showPlaybackQueueFetchErrorToast,
  showPlaybackQueueNoTracksToast,
  showPlaybackQueueSuccessToast,
} from "src/utils/playbackQueueToast";
import { parseReleaseId } from "src/utils/releaseNotes";

export const useCollectionRadioPlayback = () => {
  const playback = useReleasePlayback();
  const sortedReleases = useSortedFilteredReleases();
  const queryClient = useQueryClient();
  const setCollectionRadioSession = useSetAtom(collectionRadioSessionAtom);
  const [isStarting, setIsStarting] = useState(false);

  const startCollectionRadio = useCallback(async () => {
    if (isStarting || sortedReleases.length === 0) {
      if (sortedReleases.length === 0) {
        showPlaybackQueueNoTracksToast();
      }

      return;
    }

    setIsStarting(true);

    let fetchFailed = false;

    try {
      for (const release of sortedReleases) {
        const releaseId = parseReleaseId(release);

        if (releaseId === null) {
          continue;
        }

        let detail: DiscogsReleaseDetail;

        try {
          detail = await queryClient.fetchQuery(
            discogsReleaseQueryOptions(String(releaseId)),
          );
        } catch {
          fetchFailed = true;
          continue;
        }

        const plan = planCollectionRadioStartFromDetail(release, detail);

        if (!plan) {
          continue;
        }

        playback.startPlayback({
          release: plan.startItem.release,
          trackPosition: plan.startItem.trackPosition,
          trackTitle: plan.startItem.trackTitle,
          rebuildAlbumQueue: false,
          startPaused: false,
          upcomingQueue: plan.upcomingItems,
        });

        const startIndex = sortedReleases.findIndex(
          (candidate) =>
            String(candidate.instance_id) ===
            String(plan.startItem.release.instance_id),
        );
        setCollectionRadioSession(
          createCollectionRadioSession(
            sortedReleases,
            startIndex < 0 ? 1 : startIndex + 1,
          ),
        );

        showPlaybackQueueSuccessToast(plan.upcomingItems.length + 1);
        return;
      }

      if (fetchFailed) {
        showPlaybackQueueFetchErrorToast();
        return;
      }

      showPlaybackQueueNoTracksToast();
    } finally {
      setIsStarting(false);
    }
  }, [
    isStarting,
    playback,
    queryClient,
    setCollectionRadioSession,
    sortedReleases,
  ]);

  return {
    startCollectionRadio,
    isStarting,
    filteredReleaseCount: sortedReleases.length,
  };
};
