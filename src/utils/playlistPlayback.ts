import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import type { ReleasePlaybackState } from "src/types/releasePlaybackContext.types";
import { createQueueItem, getQueueItemKey } from "src/utils/playbackQueue";
import { findReleaseByInstanceId } from "src/utils/releaseNotes";

export const orderPlaylistTracks = (
  tracks: PlaylistTrackRow[],
): PlaylistTrackRow[] =>
  [...tracks].sort((left, right) => left.sort_order - right.sort_order);

export const isPlaylistTrackActiveInPlayback = (
  track: Pick<PlaylistTrackRow, "instance_id" | "track_position">,
  playback: Pick<
    ReleasePlaybackState,
    "release" | "activeTrackPosition" | "isReleasePreview"
  >,
): boolean => {
  if (!playback.release || playback.isReleasePreview) {
    return false;
  }

  return (
    String(playback.release.instance_id) === String(track.instance_id) &&
    playback.activeTrackPosition === track.track_position
  );
};

export const findActivePlaylistTrackKey = (
  orderedTracks: PlaylistTrackRow[],
  playback: Pick<
    ReleasePlaybackState,
    "release" | "activeTrackPosition" | "isReleasePreview"
  >,
): string | null => {
  const match = orderedTracks.find((row) =>
    isPlaylistTrackActiveInPlayback(row, playback),
  );

  return match?.track_key ?? null;
};

export type PlaylistPlaybackStartPlan = {
  startRow: PlaylistTrackRow;
  startItem: PlaybackQueueItem;
  upcomingItems: PlaybackQueueItem[];
  youtubeVideoId?: string;
};

export const planPlaylistPlaybackStart = (
  orderedTracks: PlaylistTrackRow[],
  startTrackKey: string,
  releases: DiscogsRelease[],
): PlaylistPlaybackStartPlan | null => {
  const startIndex = orderedTracks.findIndex(
    (row) => row.track_key === startTrackKey,
  );

  if (startIndex < 0) {
    return null;
  }

  for (let index = startIndex; index < orderedTracks.length; index += 1) {
    const row = orderedTracks[index];

    if (!row) {
      continue;
    }

    const startItem = resolvePlaylistTrackToQueueItem(row, releases);

    if (!startItem) {
      continue;
    }

    const youtubeVideoId = resolvePlaylistTrackYoutubeOverride(row);

    return {
      startRow: row,
      startItem,
      upcomingItems: buildPlaylistUpcomingAfterTrackKey(
        orderedTracks,
        row.track_key,
        releases,
      ),
      ...(youtubeVideoId ? { youtubeVideoId } : {}),
    };
  }

  return null;
};

export const buildPlaylistUpcomingAfterTrackKey = (
  orderedTracks: PlaylistTrackRow[],
  startTrackKey: string,
  releases: DiscogsRelease[],
): PlaybackQueueItem[] => {
  const startIndex = orderedTracks.findIndex(
    (row) => row.track_key === startTrackKey,
  );

  if (startIndex < 0) {
    return [];
  }

  const items: PlaybackQueueItem[] = [];

  for (let index = startIndex + 1; index < orderedTracks.length; index += 1) {
    const row = orderedTracks[index];

    if (!row) {
      continue;
    }

    const item = resolvePlaylistTrackToQueueItem(row, releases);

    if (item) {
      items.push(item);
    }
  }

  return items;
};

export const areUpcomingQueuesEqual = (
  left: PlaybackQueueItem[],
  right: PlaybackQueueItem[],
): boolean =>
  left.length === right.length &&
  left.every(
    (item, index) =>
      getQueueItemKey(item) ===
      getQueueItemKey(right[index] as PlaybackQueueItem),
  );

export const shouldSyncUpcomingQueueToPlaylistOrder = (
  orderedTrackKeys: string[],
  activeTrackKey: string | null,
  upcomingQueue: PlaybackQueueItem[],
): boolean => {
  if (!activeTrackKey) {
    return false;
  }

  const indexByTrackKey = new Map(
    orderedTrackKeys.map((trackKey, index) => [trackKey, index]),
  );
  const activeIndex = indexByTrackKey.get(activeTrackKey);

  if (activeIndex === undefined) {
    return false;
  }

  const indices: number[] = [activeIndex];

  for (const item of upcomingQueue) {
    const queueIndex = indexByTrackKey.get(getQueueItemKey(item));

    if (queueIndex === undefined) {
      return false;
    }

    indices.push(queueIndex);
  }

  for (let index = 1; index < indices.length; index += 1) {
    const previous = indices[index - 1];
    const current = indices[index];

    if (
      previous === undefined ||
      current === undefined ||
      current <= previous
    ) {
      return false;
    }
  }

  return true;
};

export const resolvePlaylistTrackToQueueItem = (
  track: PlaylistTrackRow,
  releases: DiscogsRelease[],
): PlaybackQueueItem | null => {
  const release = findReleaseByInstanceId(releases, track.instance_id);

  if (!release) {
    return null;
  }

  return createQueueItem({
    release,
    trackPosition: track.track_position,
    trackTitle: track.track_title,
  });
};

export type PlayablePlaylistEntry = {
  row: PlaylistTrackRow;
  item: PlaybackQueueItem;
};

export const collectPlayablePlaylistEntries = (
  tracks: PlaylistTrackRow[],
  releases: DiscogsRelease[],
): PlayablePlaylistEntry[] => {
  const orderedTracks = orderPlaylistTracks(tracks);
  const entries: PlayablePlaylistEntry[] = [];

  for (const row of orderedTracks) {
    const item = resolvePlaylistTrackToQueueItem(row, releases);

    if (item) {
      entries.push({ row, item });
    }
  }

  return entries;
};

export const resolvePlaylistTracksToQueueItems = (
  tracks: PlaylistTrackRow[],
  releases: DiscogsRelease[],
): PlaybackQueueItem[] => {
  const items: PlaybackQueueItem[] = [];

  for (const track of tracks) {
    const item = resolvePlaylistTrackToQueueItem(track, releases);

    if (item) {
      items.push(item);
    }
  }

  return items;
};

export const resolvePlaylistTrackYoutubeOverride = (
  track: PlaylistTrackRow,
): string | undefined => {
  const trimmed = track.youtube_id?.trim();

  return trimmed ? trimmed : undefined;
};
