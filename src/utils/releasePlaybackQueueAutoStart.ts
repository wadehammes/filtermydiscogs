export const shouldAutoStartPlaybackOnQueueAdd = ({
  autoPlayOnQueueAdd,
  hasActiveRelease,
  queueLength,
}: {
  autoPlayOnQueueAdd: boolean;
  hasActiveRelease: boolean;
  queueLength: number;
}): boolean => autoPlayOnQueueAdd && !hasActiveRelease && queueLength === 0;
