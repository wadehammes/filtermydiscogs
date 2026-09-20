export const PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS = 5000;

export const shouldArmPlaybackEmbedStartWatchdog = (
  visibilityState: DocumentVisibilityState,
): boolean => visibilityState !== "hidden";

export const createEmbedPlaybackStartWatchdog = ({
  delayMs,
  schedule,
  cancel,
}: {
  delayMs: number;
  schedule: (callback: () => void, delayMs: number) => number;
  cancel: (timeoutId: number) => void;
}) => {
  let timeoutId: number | null = null;

  const disarm = () => {
    if (timeoutId === null) {
      return;
    }

    cancel(timeoutId);
    timeoutId = null;
  };

  return {
    arm: (onTimeout: () => void) => {
      disarm();
      timeoutId = schedule(() => {
        timeoutId = null;
        onTimeout();
      }, delayMs);
    },
    disarm,
  };
};
