import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  buildReleasePlaybackMatchIndex,
  findTrackIndexByPosition,
  getPreviewTrackPosition,
  getPreviewVideoTitle,
} from "src/utils/releasePlayback";

export const getQueueItemKey = (
  item: Pick<PlaybackQueueItem, "instanceId" | "trackPosition">,
): string => `${item.instanceId}:${item.trackPosition}`;

export const isSameQueueItem = (
  left: Pick<PlaybackQueueItem, "instanceId" | "trackPosition">,
  right: Pick<PlaybackQueueItem, "instanceId" | "trackPosition">,
): boolean => getQueueItemKey(left) === getQueueItemKey(right);

export const createQueueItem = ({
  release,
  trackPosition,
  trackTitle,
}: {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
}): PlaybackQueueItem => ({
  instanceId: String(release.instance_id),
  trackPosition,
  trackTitle,
  release,
});

export const createPreviewQueueItem = ({
  release,
  video,
}: {
  release: DiscogsRelease;
  video: DiscogsVideo;
}): PlaybackQueueItem => ({
  instanceId: String(release.instance_id),
  trackPosition: getPreviewTrackPosition(video),
  trackTitle: getPreviewVideoTitle(video),
  previewVideoUri: video.uri,
  release,
});

export const findQueueItemIndex = (
  queue: PlaybackQueueItem[],
  item: Pick<PlaybackQueueItem, "instanceId" | "trackPosition">,
): number => {
  const key = getQueueItemKey(item);

  return queue.findIndex((queueItem) => getQueueItemKey(queueItem) === key);
};

export const appendQueueItem = (
  queue: PlaybackQueueItem[],
  item: PlaybackQueueItem,
): PlaybackQueueItem[] => {
  if (findQueueItemIndex(queue, item) >= 0) {
    return queue;
  }

  return [...queue, item];
};

export const removeQueueItemAtIndex = (
  queue: PlaybackQueueItem[],
  index: number,
): PlaybackQueueItem[] => {
  if (index < 0 || index >= queue.length) {
    return queue;
  }

  return queue.filter((_, queueIndex) => queueIndex !== index);
};

export const reorderQueueItems = (
  queue: PlaybackQueueItem[],
  fromIndex: number,
  toIndex: number,
): PlaybackQueueItem[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= queue.length ||
    toIndex >= queue.length
  ) {
    return queue;
  }

  const nextQueue = [...queue];
  const [movedItem] = nextQueue.splice(fromIndex, 1);

  if (!movedItem) {
    return queue;
  }

  nextQueue.splice(toIndex, 0, movedItem);

  return nextQueue;
};

export const adjustQueueIndexAfterReorder = ({
  queueIndex,
  fromIndex,
  toIndex,
}: {
  queueIndex: number;
  fromIndex: number;
  toIndex: number;
}): number => {
  if (fromIndex === toIndex) {
    return queueIndex;
  }

  if (queueIndex === fromIndex) {
    return toIndex;
  }

  if (fromIndex < queueIndex && toIndex >= queueIndex) {
    return queueIndex - 1;
  }

  if (fromIndex > queueIndex && toIndex <= queueIndex) {
    return queueIndex + 1;
  }

  return queueIndex;
};

export const buildPlayableAlbumQueue = ({
  release,
  tracks,
  videos,
  startPosition,
}: {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  startPosition: string;
}): PlaybackQueueItem[] => {
  const startIndex = findTrackIndexByPosition(tracks, startPosition);

  if (startIndex < 0) {
    return [
      createQueueItem({
        release,
        trackPosition: startPosition,
        trackTitle: startPosition,
      }),
    ];
  }

  const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);
  const items: PlaybackQueueItem[] = [];

  for (let index = startIndex; index < tracks.length; index += 1) {
    const track = tracks[index];

    if (!(track && matchIndex.trackVideoByPosition.has(track.position))) {
      continue;
    }

    items.push(
      createQueueItem({
        release,
        trackPosition: track.position,
        trackTitle: track.title,
      }),
    );
  }

  if (items.length > 0) {
    return items;
  }

  return [];
};

export const buildFullPlayableAlbumQueue = ({
  release,
  tracks,
  videos,
}: {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
}): PlaybackQueueItem[] => {
  const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);
  const firstPlayableTrack = tracks.find((track) =>
    matchIndex.trackVideoByPosition.has(track.position),
  );

  if (!firstPlayableTrack) {
    return [];
  }

  return buildPlayableAlbumQueue({
    release,
    tracks,
    videos,
    startPosition: firstPlayableTrack.position,
  });
};

export const appendUniqueQueueItems = (
  queue: PlaybackQueueItem[],
  items: PlaybackQueueItem[],
): PlaybackQueueItem[] => {
  const existingKeys = collectQueueItemKeys(queue);
  const uniqueItems = items.filter((item) => {
    const itemKey = getQueueItemKey(item);

    if (existingKeys.has(itemKey)) {
      return false;
    }

    existingKeys.add(itemKey);
    return true;
  });

  return uniqueItems.length === 0 ? queue : [...queue, ...uniqueItems];
};

export const collectQueueItemKeys = (
  queue: readonly PlaybackQueueItem[],
): Set<string> => new Set(queue.map((item) => getQueueItemKey(item)));

export const shuffleQueueItems = <T>(items: readonly T[]): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const swap = shuffled[swapIndex];

    if (current !== undefined && swap !== undefined) {
      shuffled[index] = swap;
      shuffled[swapIndex] = current;
    }
  }

  return shuffled;
};
