export type PlaybackQueueAutopopulateSource =
  | "similar-tail"
  | "collection-radio";

export const resolvePlaybackQueueAutopopulateSource = ({
  collectionRadioActive,
  isCollectionRadioQueueLoading,
  isSimilarQueueLoading,
  queueHasSimilarTailItems,
  queueHasCollectionRadioTailItems,
}: {
  collectionRadioActive: boolean;
  isCollectionRadioQueueLoading: boolean;
  isSimilarQueueLoading: boolean;
  queueHasSimilarTailItems: boolean;
  queueHasCollectionRadioTailItems: boolean;
}): PlaybackQueueAutopopulateSource | null => {
  if (
    collectionRadioActive ||
    isCollectionRadioQueueLoading ||
    queueHasCollectionRadioTailItems
  ) {
    return "collection-radio";
  }

  if (isSimilarQueueLoading || queueHasSimilarTailItems) {
    return "similar-tail";
  }

  return null;
};

export const resolvePlaybackQueueDrawerStatusMessage = ({
  isAlbumQueueBuilding,
  isSimilarQueueLoading,
  isCollectionRadioQueueLoading,
  autopopulateSource,
}: {
  isAlbumQueueBuilding: boolean;
  isSimilarQueueLoading: boolean;
  isCollectionRadioQueueLoading: boolean;
  autopopulateSource: PlaybackQueueAutopopulateSource | null;
}): string | null => {
  if (isCollectionRadioQueueLoading) {
    return "Collection radio is adding up next from your filters… You can still reorder upcoming tracks.";
  }

  if (isSimilarQueueLoading) {
    return "Adding similar releases to the queue… You can still reorder upcoming tracks.";
  }

  if (isAlbumQueueBuilding) {
    return "Finishing album tracklist… You can still reorder upcoming tracks.";
  }

  if (autopopulateSource === "collection-radio") {
    return "Collection radio will keep adding tracks from your filtered collection.";
  }

  if (autopopulateSource === "similar-tail") {
    return "Similar releases are filling the queue tail.";
  }

  return null;
};

export const queueHasSimilarTailItems = (
  queue: readonly { fromSimilarRelease?: boolean }[],
): boolean => queue.some((item) => item.fromSimilarRelease === true);

export const queueHasCollectionRadioTailItems = (
  queue: readonly { fromCollectionRadio?: boolean }[],
): boolean => queue.some((item) => item.fromCollectionRadio === true);

export const shouldSuppressSimilarQueueTailForCollectionRadio = ({
  collectionRadioActive,
  upcomingQueue,
}: {
  collectionRadioActive: boolean;
  upcomingQueue: readonly { fromCollectionRadio?: boolean }[];
}): boolean =>
  collectionRadioActive || queueHasCollectionRadioTailItems(upcomingQueue);
