"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { type RefObject, useCallback, useState } from "react";
import {
  type CollectionRadioSession,
  collectionRadioSessionAtom,
} from "src/atoms/collectionRadioPlayback.atoms";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import {
  createSimilarQueueMode,
  MANUAL_QUEUE_TAIL_EXTEND_THRESHOLD,
  QUEUE_TAIL_EXTEND_THRESHOLD,
  type SimilarQueueMode,
} from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import type {
  DiscogsReleaseDetail,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  createCollectionRadioSession,
  planCollectionRadioAlbumQueueFromDetail,
} from "src/utils/collectionRadioPlayback";
import { appendUniqueQueueItems } from "src/utils/playbackQueue";
import { parseReleaseId } from "src/utils/releaseNotes";

interface UseCollectionRadioQueueParams {
  queryClient: QueryClient;
  collectionRadioSession: CollectionRadioSession | null;
  updateUpcomingQueue: (
    updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[],
  ) => void;
  queueRef: RefObject<PlaybackQueueItem[]>;
  queueManuallyExtendedRef: RefObject<boolean>;
  similarQueueModeRef: RefObject<SimilarQueueMode>;
  collectionRadioFetchInFlightRef: RefObject<boolean>;
  similarQueueSuppressedAfterClearRef: RefObject<boolean>;
  previewVideoRef: RefObject<DiscogsVideo | null>;
}

export const useCollectionRadioQueue = ({
  queryClient,
  collectionRadioSession,
  updateUpcomingQueue,
  queueRef,
  queueManuallyExtendedRef,
  similarQueueModeRef,
  collectionRadioFetchInFlightRef,
  similarQueueSuppressedAfterClearRef,
  previewVideoRef,
}: UseCollectionRadioQueueParams) => {
  const setCollectionRadioSession = useSetAtom(collectionRadioSessionAtom);
  const [isCollectionRadioQueueLoading, setIsCollectionRadioQueueLoading] =
    useState(false);

  const clearCollectionRadioSession = useCallback(() => {
    setCollectionRadioSession(null);
  }, [setCollectionRadioSession]);

  const fetchNextCollectionRadioItems = useCallback(
    async (
      session: CollectionRadioSession,
    ): Promise<{
      items: PlaybackQueueItem[];
      nextReleaseIndex: number;
    } | null> => {
      for (
        let index = session.nextReleaseIndex;
        index < session.orderedReleases.length;
        index += 1
      ) {
        const release = session.orderedReleases[index];

        if (!release) {
          continue;
        }

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
          continue;
        }

        const albumQueue = planCollectionRadioAlbumQueueFromDetail(
          release,
          detail,
        );

        if (albumQueue.length === 0) {
          continue;
        }

        return {
          items: albumQueue,
          nextReleaseIndex: index + 1,
        };
      }

      return null;
    },
    [queryClient],
  );

  const extendCollectionRadioTail = useCallback(async (): Promise<boolean> => {
    const session = collectionRadioSession;

    if (
      !session ||
      collectionRadioFetchInFlightRef.current ||
      previewVideoRef.current !== null
    ) {
      return false;
    }

    collectionRadioFetchInFlightRef.current = true;
    setIsCollectionRadioQueueLoading(true);
    similarQueueModeRef.current = createSimilarQueueMode(false);

    try {
      const nextBatch = await fetchNextCollectionRadioItems(session);

      if (!nextBatch) {
        setCollectionRadioSession(null);
        return false;
      }

      let appended = false;

      updateUpcomingQueue((previousQueue) => {
        const nextQueue = appendUniqueQueueItems(
          previousQueue,
          nextBatch.items,
        );
        appended = nextQueue.length > previousQueue.length;
        return nextQueue;
      });

      if (appended) {
        setCollectionRadioSession(
          createCollectionRadioSession(
            session.orderedReleases,
            nextBatch.nextReleaseIndex,
          ),
        );
      } else if (nextBatch.nextReleaseIndex >= session.orderedReleases.length) {
        setCollectionRadioSession(null);
      }

      return appended;
    } finally {
      collectionRadioFetchInFlightRef.current = false;
      setIsCollectionRadioQueueLoading(false);
    }
  }, [
    collectionRadioFetchInFlightRef,
    collectionRadioSession,
    fetchNextCollectionRadioItems,
    previewVideoRef,
    setCollectionRadioSession,
    similarQueueModeRef,
    updateUpcomingQueue,
  ]);

  const maybeExtendCollectionRadioTail = useCallback(() => {
    if (
      !collectionRadioSession ||
      previewVideoRef.current !== null ||
      collectionRadioFetchInFlightRef.current ||
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

    void extendCollectionRadioTail();
  }, [
    collectionRadioFetchInFlightRef,
    collectionRadioSession,
    extendCollectionRadioTail,
    previewVideoRef,
    queueManuallyExtendedRef,
    queueRef,
    similarQueueSuppressedAfterClearRef,
  ]);

  return {
    clearCollectionRadioSession,
    extendCollectionRadioTail,
    maybeExtendCollectionRadioTail,
    isCollectionRadioQueueLoading,
  };
};
