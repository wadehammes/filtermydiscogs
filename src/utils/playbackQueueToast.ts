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

export const showPlaybackQueueSuccessToast = (trackCount: number): void => {
  toast.success(
    trackCount === 1
      ? "Added 1 track to queue"
      : `Added ${trackCount} tracks to queue`,
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

export const showPlaybackQueueFetchErrorToast = (): void => {
  toast.error("Could not load release details", queueToastOptions());
};

export const showSimilarQueueTailToast = (): void => {
  toast.success(
    "Added a related track from your collection to Up next.",
    queueToastOptions(),
  );
};
