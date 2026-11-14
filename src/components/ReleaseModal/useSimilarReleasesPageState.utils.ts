export type SimilarReleasesPageState = {
  anchorKey: string;
  collectionCount: number;
  index: number;
};

export const clampSimilarPageIndex = (index: number, pageCount: number) => {
  if (pageCount <= 0) {
    return 0;
  }

  return Math.min(index, pageCount - 1);
};

export const resolveSimilarReleasesPageState = ({
  anchorKey,
  collectionReleaseCount,
  previous,
  pageCount,
  restoredPageIndex,
}: {
  anchorKey: string;
  collectionReleaseCount: number;
  previous: SimilarReleasesPageState;
  pageCount: number;
  restoredPageIndex: number;
}): SimilarReleasesPageState => {
  const anchorChanged = previous.anchorKey !== anchorKey;
  const collectionChanged = previous.collectionCount !== collectionReleaseCount;

  if (anchorChanged) {
    const index =
      pageCount <= 0
        ? restoredPageIndex
        : clampSimilarPageIndex(restoredPageIndex, pageCount);

    return {
      anchorKey,
      collectionCount: collectionReleaseCount,
      index,
    };
  }

  if (collectionChanged) {
    const index =
      pageCount <= 0
        ? previous.index
        : clampSimilarPageIndex(previous.index, pageCount);

    return {
      anchorKey,
      collectionCount: collectionReleaseCount,
      index,
    };
  }

  if (pageCount <= 0) {
    return previous;
  }

  const clampedIndex = clampSimilarPageIndex(previous.index, pageCount);

  return clampedIndex === previous.index
    ? previous
    : { ...previous, index: clampedIndex };
};
