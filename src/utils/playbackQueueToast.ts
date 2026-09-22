import { type ToastPosition, toast } from "src/utils/toast";

const PLAYBACK_QUEUE_TOAST_MOBILE_QUERY = "(max-width: 768px)";

export const getPlaybackQueueToastPosition = (): ToastPosition => {
  if (typeof window === "undefined") {
    return "bottom-center";
  }

  return window.matchMedia(PLAYBACK_QUEUE_TOAST_MOBILE_QUERY).matches
    ? "top-center"
    : "bottom-center";
};

const queueToastOptions = () => ({
  position: getPlaybackQueueToastPosition(),
});

const playbackQueueTrackCountMessage = (
  action: "added" | "removed",
  trackCount: number,
): string => {
  const tracks = trackCount === 1 ? "1 track" : `${trackCount} tracks`;

  return action === "added"
    ? `Added ${tracks} to queue`
    : `Removed ${tracks} from queue`;
};

export const showPlaybackQueueSuccessToast = (trackCount: number): void => {
  toast.success(
    playbackQueueTrackCountMessage("added", trackCount),
    queueToastOptions(),
  );
};

export const showPlaybackQueueNoTracksToast = (): void => {
  toast.error("No playable tracks to queue", queueToastOptions());
};

export const showPlaybackQueueAllQueuedToast = (): void => {
  toast.error(
    "All playable tracks are already in the queue",
    queueToastOptions(),
  );
};

export const showPlaybackQueueRemovedToast = (trackCount: number): void => {
  toast.success(
    playbackQueueTrackCountMessage("removed", trackCount),
    queueToastOptions(),
  );
};

export const showPlaybackQueueFetchErrorToast = (): void => {
  toast.error("Could not load release details", queueToastOptions());
};

export const showSimilarQueueTailToast = (): void => {
  toast.success(
    "Added a related track from your collection to Up next.",
    queueToastOptions(),
  );
};
