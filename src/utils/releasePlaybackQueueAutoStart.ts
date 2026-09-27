export const shouldAutoStartPlaybackOnQueueAdd = ({
  autoPlayOnQueueAdd,
  hasActiveRelease,
  isTransportActive,
  queueLength,
}: {
  autoPlayOnQueueAdd: boolean;
  hasActiveRelease: boolean;
  isTransportActive: boolean;
  queueLength: number;
}): boolean =>
  autoPlayOnQueueAdd &&
  queueLength === 0 &&
  !(hasActiveRelease && isTransportActive);
