"use client";

import { useCallback } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import { showPlaybackQueueSuccessToast } from "src/utils/playbackQueueToast";
import {
  areUpcomingQueuesEqual,
  buildPlaylistUpcomingAfterTrackKey,
  collectPlayablePlaylistEntries,
  findActivePlaylistTrackKey,
  orderPlaylistTracks,
  planPlaylistPlaybackStart,
  resolvePlaylistTracksToQueueItems,
  resolvePlaylistTrackYoutubeOverride,
  shouldSyncUpcomingQueueToPlaylistOrder,
} from "src/utils/playlistPlayback";
import { toast } from "src/utils/toast";

export const usePlaylistPlayback = (options?: {
  releases?: DiscogsRelease[];
}) => {
  const playback = useReleasePlayback();
  const allReleasesFromCollection = useAllReleases();
  const allReleases = options?.releases ?? allReleasesFromCollection;

  const startPlaylistAtTrackKey = useCallback(
    (orderedTracks: PlaylistTrackRow[], startTrackKey: string) => {
      const plan = planPlaylistPlaybackStart(
        orderedTracks,
        startTrackKey,
        allReleases,
      );

      if (!plan) {
        return false;
      }

      playback.clearQueue();
      playback.startPlayback({
        release: plan.startItem.release,
        trackPosition: plan.startItem.trackPosition,
        trackTitle: plan.startItem.trackTitle,
        rebuildAlbumQueue: false,
        startPaused: false,
        upcomingQueue: plan.upcomingItems,
        ...definedProps({
          artist: plan.startItem.artist,
          releaseTitle: plan.startItem.releaseTitle,
          youtubeVideoId: plan.startItem.youtubeVideoId,
        }),
      });

      return true;
    },
    [allReleases, playback],
  );

  const appendPlaylistEntryToQueue = useCallback(
    (row: PlaylistTrackRow, item: PlaybackQueueItem) => {
      const youtubeVideoId = resolvePlaylistTrackYoutubeOverride(row);

      playback.addToQueue({
        release: item.release,
        trackPosition: item.trackPosition,
        trackTitle: item.trackTitle,
        ...definedProps({
          artist: item.artist,
          releaseTitle: item.releaseTitle,
          youtubeVideoId,
        }),
      });
    },
    [playback],
  );

  const addPlaylistToQueue = useCallback(
    (tracks: PlaylistTrackRow[]) => {
      const orderedTracks = orderPlaylistTracks(tracks);
      const playableEntries = collectPlayablePlaylistEntries(
        orderedTracks,
        allReleases,
      );

      if (playableEntries.length === 0) {
        toast.error(
          "No playlist tracks are in your collection or ready to play.",
        );
        return;
      }

      const canAppendToActivePlayback =
        playback.isMiniPlayerVisible && playback.isPlaying;

      if (canAppendToActivePlayback) {
        for (const entry of playableEntries) {
          appendPlaylistEntryToQueue(entry.row, entry.item);
        }
      } else {
        const firstEntry = playableEntries[0];

        if (!firstEntry) {
          return;
        }

        const firstOverride = resolvePlaylistTrackYoutubeOverride(
          firstEntry.row,
        );

        playback.startPlayback({
          release: firstEntry.item.release,
          trackPosition: firstEntry.item.trackPosition,
          trackTitle: firstEntry.item.trackTitle,
          rebuildAlbumQueue: false,
          ...(playback.autoPlayOnQueueAdd ? {} : { startPaused: true }),
          ...definedProps({
            artist: firstEntry.item.artist,
            releaseTitle: firstEntry.item.releaseTitle,
            youtubeVideoId: firstOverride,
          }),
        });

        for (const entry of playableEntries.slice(1)) {
          appendPlaylistEntryToQueue(entry.row, entry.item);
        }
      }

      const skippedCount = orderedTracks.length - playableEntries.length;

      if (skippedCount > 0) {
        toast.error(
          `${skippedCount} track${skippedCount === 1 ? "" : "s"} skipped — not in your collection.`,
        );
      }

      showPlaybackQueueSuccessToast(playableEntries.length);
    },
    [allReleases, appendPlaylistEntryToQueue, playback],
  );

  const playPlaylistTracks = useCallback(
    (tracks: PlaylistTrackRow[]) => {
      const orderedTracks = orderPlaylistTracks(tracks);
      const queueItems = resolvePlaylistTracksToQueueItems(
        orderedTracks,
        allReleases,
      );

      if (queueItems.length === 0) {
        toast.error(
          options?.releases
            ? "No tracks on this playlist are available to play."
            : "No playlist tracks are in your collection or ready to play.",
        );
        return;
      }

      const firstOrderedTrack = orderedTracks[0];

      if (
        !(
          firstOrderedTrack &&
          startPlaylistAtTrackKey(orderedTracks, firstOrderedTrack.track_key)
        )
      ) {
        return;
      }

      const skippedCount = orderedTracks.length - queueItems.length;

      if (skippedCount > 0) {
        toast.error(
          `${skippedCount} track${skippedCount === 1 ? "" : "s"} skipped — not in your collection.`,
        );
      }

      showPlaybackQueueSuccessToast(queueItems.length);
    },
    [allReleases, options?.releases, startPlaylistAtTrackKey],
  );

  const playPlaylistTrack = useCallback(
    (track: PlaylistTrackRow, playlistTracks: PlaylistTrackRow[]) => {
      const orderedTracks = orderPlaylistTracks(playlistTracks);
      const rowInPlaylist = orderedTracks.find(
        (row) => row.track_key === track.track_key,
      );

      if (!rowInPlaylist) {
        toast.error("This track is not in the playlist.");
        return;
      }

      const started = startPlaylistAtTrackKey(
        orderedTracks,
        rowInPlaylist.track_key,
      );

      if (!started) {
        toast.error(
          options?.releases
            ? "This track is not available to play from this playlist."
            : "This track is not in your loaded collection.",
        );
      }
    },
    [options?.releases, startPlaylistAtTrackKey],
  );

  const syncPlaylistQueueToTrackOrder = useCallback(
    (tracks: PlaylistTrackRow[]) => {
      const orderedTracks = orderPlaylistTracks(tracks);
      const orderedTrackKeys = orderedTracks.map((row) => row.track_key);
      const activeTrackKey = findActivePlaylistTrackKey(
        orderedTracks,
        playback,
      );

      if (
        !(
          activeTrackKey &&
          shouldSyncUpcomingQueueToPlaylistOrder(
            orderedTrackKeys,
            activeTrackKey,
            playback.queue,
          )
        )
      ) {
        return;
      }

      const upcomingItems = buildPlaylistUpcomingAfterTrackKey(
        orderedTracks,
        activeTrackKey,
        allReleases,
      );

      if (areUpcomingQueuesEqual(upcomingItems, playback.queue)) {
        return;
      }

      playback.replaceUpcomingQueue(upcomingItems);
    },
    [allReleases, playback],
  );

  return {
    addPlaylistToQueue,
    playPlaylistTracks,
    playPlaylistTrack,
    syncPlaylistQueueToTrackOrder,
  };
};
