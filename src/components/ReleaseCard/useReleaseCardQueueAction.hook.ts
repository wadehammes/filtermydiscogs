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
  const { addToQueue } = useReleasePlaybackActions();
  const {
    queue,
    release: activeRelease,
    isMiniPlayerVisible,
    activeTrackPosition,
  } = useReleasePlaybackState();
  const releaseId = parseReleaseId(release);
  const instanceId = String(release.instance_id);
  const [isAdding, setIsAdding] = useState(false);
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

  const isReleaseInQueue = useMemo(
    () => queue.some((item) => item.instanceId === instanceId),
    [instanceId, queue],
  );

  const handleAddToQueue = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isReleaseInQueue || isAdding || releaseId === null) {
        return;
      }

      setIsAdding(true);

      try {
        const releaseDetail =
          cachedReleaseDetail ??
          (await queryClient.fetchQuery(
            discogsReleaseQueryOptions(String(releaseId)),
          ));
        const tracks = flattenTracklist(releaseDetail?.tracklist ?? []);
        const matchIndex = buildReleasePlaybackMatchIndex(
          tracks,
          releaseDetail?.videos ?? [],
        );
        const nextPlayableTrack = tracks.find(
          (track) =>
            matchIndex.trackVideoByPosition.has(track.position) &&
            !isTrackQueuedOrPlaying(track.position),
        );

        if (!nextPlayableTrack) {
          return;
        }

        addToQueue({
          release,
          trackPosition: nextPlayableTrack.position,
          trackTitle: nextPlayableTrack.title,
        });
      } finally {
        setIsAdding(false);
      }
    },
    [
      addToQueue,
      cachedReleaseDetail,
      isAdding,
      isReleaseInQueue,
      isTrackQueuedOrPlaying,
      queryClient,
      release,
      releaseId,
    ],
  );

  return {
    handleAddToQueue,
    isReleaseInQueue,
    isAdding,
  };
};
