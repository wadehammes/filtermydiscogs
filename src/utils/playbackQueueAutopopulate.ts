export type PlaybackQueueAutopopulateSource = "similar-tail";

export const resolvePlaybackQueueAutopopulateSource = ({
  isSimilarQueueLoading,
  queueHasSimilarTailItems,
}: {
  isSimilarQueueLoading: boolean;
  queueHasSimilarTailItems: boolean;
}): PlaybackQueueAutopopulateSource | null => {
  if (isSimilarQueueLoading || queueHasSimilarTailItems) {
    return "similar-tail";
  }

  return null;
};

export const resolvePlaybackQueueDrawerStatusMessage = ({
  isAlbumQueueBuilding,
  isSimilarQueueLoading,
  autopopulateSource,
}: {
  isAlbumQueueBuilding: boolean;
  isSimilarQueueLoading: boolean;
  autopopulateSource: PlaybackQueueAutopopulateSource | null;
}): string | null => {
  if (isSimilarQueueLoading) {
    return "Adding similar releases to the queue… You can still reorder upcoming tracks.";
  }

  if (isAlbumQueueBuilding) {
    return "Finishing album tracklist… You can still reorder upcoming tracks.";
  }

  if (autopopulateSource === "similar-tail") {
    return "Similar releases are filling the queue tail.";
  }

  return null;
};

export const queueHasSimilarTailItems = (
  queue: readonly { fromSimilarRelease?: boolean }[],
): boolean => queue.some((item) => item.fromSimilarRelease === true);
