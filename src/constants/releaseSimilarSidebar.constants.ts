export const RELEASE_SIMILAR_SIDEBAR_TITLE = "Similar in your collection";

export const RELEASE_SIMILAR_SIDEBAR_SUBTITLE =
  "Shared genres and styles with this release.";

export const RELEASE_SIMILAR_SHUFFLE_LABEL = "Shuffle";

export const RELEASE_SIMILAR_SHUFFLE_ARIA_LABEL = "Shuffle similar releases";

export const RELEASE_SIMILAR_SHUFFLE_TOOLTIP =
  "Show another batch of similar releases from your collection.";

export const formatSimilarReleaseCountLabel = (totalCount: number): string =>
  totalCount === 1 ? "1 similar" : `${totalCount} similar`;
