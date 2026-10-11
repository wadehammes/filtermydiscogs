import type { ReactNode } from "react";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { ACTION_TOAST_CLASS_NAMES } from "src/utils/actionToast";
import { type ToastPosition, toast } from "src/utils/toast";

export const getPlaybackQueueToastPosition = (): ToastPosition => {
  if (typeof window === "undefined") {
    return "bottom-center";
  }

  return window.matchMedia(COMPACT_LAYOUT_MEDIA_QUERY).matches
    ? "top-center"
    : "bottom-center";
};

const queueToastOptions = () => ({
  position: getPlaybackQueueToastPosition(),
});

export const showPersistentQueueAreaErrorToast = ({
  id,
  title,
  description,
  toastClassName,
  onClose,
  showClose = true,
}: {
  id: string;
  title: string;
  description: ReactNode;
  toastClassName?: string;
  onClose?: () => void;
  showClose?: boolean;
}) => {
  toast.error(title, {
    id,
    duration: Number.POSITIVE_INFINITY,
    position: getPlaybackQueueToastPosition(),
    description,
    showClose,
    ...(onClose !== undefined ? { onClose } : {}),
    classNames: {
      toast: toastClassName ?? ACTION_TOAST_CLASS_NAMES.toast,
      description: ACTION_TOAST_CLASS_NAMES.description,
    },
  });
};

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
