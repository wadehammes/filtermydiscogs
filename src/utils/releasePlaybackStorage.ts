import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

export const RELEASE_PLAYBACK_STORAGE_KEY = "filtermydiscogs_release_playback";

export interface PersistedQueueItem {
  instanceId: string;
  trackPosition: string;
  trackTitle: string;
  previewVideoUri?: string;
}

export interface PersistedReleasePlayback {
  instanceId: string;
  trackPosition: string;
  queue?: PersistedQueueItem[];
}

const isPersistedQueueItem = (value: unknown): value is PersistedQueueItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedQueueItem;

  return (
    typeof candidate.instanceId === "string" &&
    candidate.instanceId.length > 0 &&
    typeof candidate.trackPosition === "string" &&
    candidate.trackPosition.length > 0 &&
    typeof candidate.trackTitle === "string" &&
    candidate.trackTitle.length > 0 &&
    (candidate.previewVideoUri === undefined ||
      typeof candidate.previewVideoUri === "string")
  );
};

const isPersistedReleasePlayback = (
  value: unknown,
): value is PersistedReleasePlayback => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedReleasePlayback;

  if (
    typeof candidate.instanceId !== "string" ||
    candidate.instanceId.length === 0 ||
    typeof candidate.trackPosition !== "string" ||
    candidate.trackPosition.length === 0
  ) {
    return false;
  }

  if (candidate.queue === undefined) {
    return true;
  }

  return (
    Array.isArray(candidate.queue) &&
    candidate.queue.every(isPersistedQueueItem)
  );
};

export const toPersistedQueueItem = (
  item: PlaybackQueueItem,
): PersistedQueueItem => ({
  instanceId: item.instanceId,
  trackPosition: item.trackPosition,
  trackTitle: item.trackTitle,
  ...(item.previewVideoUri ? { previewVideoUri: item.previewVideoUri } : {}),
});

export const readPersistedReleasePlayback =
  (): PersistedReleasePlayback | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const storedPayload = localStorage.getItem(RELEASE_PLAYBACK_STORAGE_KEY);

      if (!storedPayload) {
        return null;
      }

      const parsedJson: unknown = JSON.parse(storedPayload);

      if (!isPersistedReleasePlayback(parsedJson)) {
        return null;
      }

      return parsedJson;
    } catch {
      return null;
    }
  };

export const writePersistedReleasePlayback = (
  playback: PersistedReleasePlayback,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(RELEASE_PLAYBACK_STORAGE_KEY, JSON.stringify(playback));
};

export const clearPersistedReleasePlayback = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(RELEASE_PLAYBACK_STORAGE_KEY);
};
