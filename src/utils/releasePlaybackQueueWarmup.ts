import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

export const UPCOMING_QUEUE_WARMUP_COUNT = 2;

export const getUpcomingQueueWarmupItems = (
  queue: PlaybackQueueItem[],
  limit: number = UPCOMING_QUEUE_WARMUP_COUNT,
): PlaybackQueueItem[] => {
  const items: PlaybackQueueItem[] = [];

  for (const item of queue) {
    if (item.previewVideoUri !== undefined) {
      continue;
    }

    items.push(item);

    if (items.length >= limit) {
      break;
    }
  }

  return items;
};
