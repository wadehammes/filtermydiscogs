"use client";

import { hashKey, useQueryClient } from "@tanstack/react-query";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  showReleaseCardQueueAllQueuedToast,
  showReleaseCardQueueFetchErrorToast,
  showReleaseCardQueueNoTracksToast,
  showReleaseCardQueueSuccessToast,
} from "src/components/ReleaseCard/releaseCardQueueToast";
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
  const releaseQueryKey =
    releaseId !== null ? DiscogsReleaseQueryKeys.byId(String(releaseId)) : null;
  const instanceId = String(release.instance_id);
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingRelease, setIsFetchingRelease] = useState(false);
  const [fetchedReleaseDetail, setFetchedReleaseDetail] = useState<
    DiscogsReleaseDetail | undefined
  >();

  useEffect(() => {
    setFetchedReleaseDetail(undefined);
  }, [instanceId]);

  const cachedReleaseDetail = useSyncExternalStore(
    (onStoreChange) => {
      if (!releaseQueryKey) {
        return () => {};
      }

      const queryHash = hashKey(releaseQueryKey);

      return queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === queryHash) {
          onStoreChange();
        }
      });
    },
    () =>
      releaseQueryKey !== null
        ? queryClient.getQueryData<DiscogsReleaseDetail>(releaseQueryKey)
        : undefined,
    () => undefined,
  );

  const releaseDetail = cachedReleaseDetail ?? fetchedReleaseDetail;

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
    if (!releaseDetail) {
      return [];
    }

    const tracks = flattenTracklist(releaseDetail.tracklist ?? []);
    const matchIndex = buildReleasePlaybackMatchIndex(
      tracks,
      releaseDetail.videos ?? [],
    );

    return tracks.filter((track) =>
      matchIndex.trackVideoByPosition.has(track.position),
    );
  }, [releaseDetail]);

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

      if (
        isReleaseInQueue ||
        isAdding ||
        isFetchingRelease ||
        releaseId === null
      ) {
        return;
      }

      setIsAdding(true);

      try {
        let releaseDetailForQueue = releaseDetail;

        if (!releaseDetailForQueue) {
          setIsFetchingRelease(true);

          try {
            releaseDetailForQueue = await queryClient.fetchQuery(
              discogsReleaseQueryOptions(String(releaseId)),
            );
            setFetchedReleaseDetail(releaseDetailForQueue);
          } catch {
            showReleaseCardQueueFetchErrorToast();
            return;
          } finally {
            setIsFetchingRelease(false);
          }
        }

        const tracks = flattenTracklist(releaseDetailForQueue?.tracklist ?? []);
        const matchIndex = buildReleasePlaybackMatchIndex(
          tracks,
          releaseDetailForQueue?.videos ?? [],
        );
        const tracksToQueue = tracks.filter(
          (track) =>
            matchIndex.trackVideoByPosition.has(track.position) &&
            !isTrackQueuedOrPlaying(track.position),
        );

        if (tracksToQueue.length === 0) {
          const playableTrackCount = tracks.filter((track) =>
            matchIndex.trackVideoByPosition.has(track.position),
          ).length;

          if (playableTrackCount === 0) {
            showReleaseCardQueueNoTracksToast();
          } else {
            showReleaseCardQueueAllQueuedToast();
          }

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
        } else {
          for (const track of tracksToQueue) {
            addToQueue({
              release,
              trackPosition: track.position,
              trackTitle: track.title,
            });
          }
        }

        showReleaseCardQueueSuccessToast(tracksToQueue.length);
      } finally {
        setIsAdding(false);
      }
    },
    [
      addToQueue,
      autoPlayOnQueueAdd,
      isAdding,
      isFetchingRelease,
      isMiniPlayerVisible,
      isReleaseInQueue,
      isTrackQueuedOrPlaying,
      queryClient,
      release,
      releaseDetail,
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
