export const formatPlaylistSkippedNotInCollectionToast = (
  skippedCount: number,
): string =>
  `${skippedCount} track${skippedCount === 1 ? "" : "s"} skipped. Not in your collection.`;
