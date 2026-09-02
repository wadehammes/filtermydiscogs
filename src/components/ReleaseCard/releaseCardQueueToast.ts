import { toast } from "src/utils/toast";

export const showReleaseCardQueueSuccessToast = (trackCount: number): void => {
  toast.success(
    trackCount === 1
      ? "Added 1 track to queue"
      : `Added ${trackCount} tracks to queue`,
  );
};

export const showReleaseCardQueueNoTracksToast = (): void => {
  toast.error("No playable tracks to queue");
};

export const showReleaseCardQueueAllQueuedToast = (): void => {
  toast.error("All playable tracks are already in the queue");
};

export const showReleaseCardQueueFetchErrorToast = (): void => {
  toast.error("Could not load release details");
};
