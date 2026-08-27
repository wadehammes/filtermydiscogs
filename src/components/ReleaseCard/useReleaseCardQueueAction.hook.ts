"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type MouseEvent, useCallback, useMemo, useState } from "react";
import {
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { isSameQueueItem } from "src/utils/playbackQueue";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  buildReleasePlaybackMatchIndex,
  flattenTracklist,
} from "src/utils/releasePlayback";

export const useReleaseCardQueueAction = (release: DiscogsRelease) => {
  const queryClient = useQueryClient();
  const { addToQueue, startPlayback } = useReleasePlaybackActions();
  const {
    queue,
    release: activeRelease,
    isMiniPlayerVisible,
    activeTrackPosition,
    autoPlayOnQueueAdd,
  } = useReleasePlaybackState();
  const releaseId = parseReleaseId(release);
  const instanceId = String(release.instance_id);
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingRelease, setIsFetchingRelease] = useState(false);
  const cachedReleaseDetail =
    releaseId !== null
      ? queryClient.getQueryData<DiscogsReleaseDetail>(
          DiscogsReleaseQueryKeys.byId(String(releaseId)),
        )
      : undefined;

  const isTrackQueuedOrPlaying = useCallback(
    (trackPosition: string) => {
      if (
        queue.some((item) =>
          isSameQueueItem(item, { instanceId, trackPosition }),
        )
      ) {
        return true;
      }

      return (
        isMiniPlayerVisible &&
        activeRelease !== null &&
        isSameReleaseInstance(activeRelease, release) &&
        activeTrackPosition === trackPosition
      );
    },
    [
      activeRelease,
      activeTrackPosition,
      instanceId,
      isMiniPlayerVisible,
      queue,
      release,
    ],
  );

  const playableTracks = useMemo(() => {
    if (!cachedReleaseDetail) {
      return [];
    }

    const tracks = flattenTracklist(cachedReleaseDetail.tracklist ?? []);
    const matchIndex = buildReleasePlaybackMatchIndex(
      tracks,
      cachedReleaseDetail.videos ?? [],
    );

    return tracks.filter((track) =>
      matchIndex.trackVideoByPosition.has(track.position),
    );
  }, [cachedReleaseDetail]);

  const isReleaseInQueue = useMemo(() => {
    if (playableTracks.length === 0) {
      return false;
    }

    return playableTracks.every((track) =>
      isTrackQueuedOrPlaying(track.position),
    );
  }, [isTrackQueuedOrPlaying, playableTracks]);

  const handleAddToQueue = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isReleaseInQueue || isAdding || releaseId === null) {
        return;
      }

      setIsAdding(true);

      try {
        let releaseDetail = cachedReleaseDetail;

        if (!releaseDetail) {
          setIsFetchingRelease(true);

          try {
            releaseDetail = await queryClient.fetchQuery(
              discogsReleaseQueryOptions(String(releaseId)),
            );
          } finally {
            setIsFetchingRelease(false);
          }
        }
        const tracks = flattenTracklist(releaseDetail?.tracklist ?? []);
        const matchIndex = buildReleasePlaybackMatchIndex(
          tracks,
          releaseDetail?.videos ?? [],
        );
        const tracksToQueue = tracks.filter(
          (track) =>
            matchIndex.trackVideoByPosition.has(track.position) &&
            !isTrackQueuedOrPlaying(track.position),
        );

        if (tracksToQueue.length === 0) {
          return;
        }

        if (!isMiniPlayerVisible) {
          const firstTrack = tracksToQueue[0];

          if (!firstTrack) {
            return;
          }

          startPlayback({
            release,
            trackPosition: firstTrack.position,
            trackTitle: firstTrack.title,
            ...(autoPlayOnQueueAdd ? {} : { startPaused: true }),
            rebuildAlbumQueue: false,
          });

          for (const track of tracksToQueue.slice(1)) {
            addToQueue({
              release,
              trackPosition: track.position,
              trackTitle: track.title,
            });
          }

          return;
        }

        for (const track of tracksToQueue) {
          addToQueue({
            release,
            trackPosition: track.position,
            trackTitle: track.title,
          });
        }
      } finally {
        setIsAdding(false);
      }
    },
    [
      addToQueue,
      autoPlayOnQueueAdd,
      cachedReleaseDetail,
      isAdding,
      isMiniPlayerVisible,
      isReleaseInQueue,
      isTrackQueuedOrPlaying,
      queryClient,
      release,
      releaseId,
      startPlayback,
    ],
  );

  return {
    handleAddToQueue,
    isReleaseInQueue,
    isAdding,
    isFetchingRelease,
  };
};
