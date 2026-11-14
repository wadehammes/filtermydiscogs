export type SimilarReleasesPageState = {
  anchorKey: string;
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
  previous,
  pageCount,
  restoredPageIndex,
}: {
  anchorKey: string;
  previous: SimilarReleasesPageState;
  pageCount: number;
  restoredPageIndex: number;
}): SimilarReleasesPageState => {
  const anchorChanged = previous.anchorKey !== anchorKey;

  if (anchorChanged) {
    const index =
      pageCount <= 0
        ? restoredPageIndex
        : clampSimilarPageIndex(restoredPageIndex, pageCount);

    return {
      anchorKey,
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
