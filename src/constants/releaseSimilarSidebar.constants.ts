export const RELEASE_SIMILAR_SIDEBAR_TITLE = "Similar in your collection";

export const RELEASE_SIMILAR_SIDEBAR_SUBTITLE =
  "Shared genres and styles with this release.";

export const RELEASE_SIMILAR_PAGE_PREV_ARIA_LABEL =
  "Previous similar releases page";

export const RELEASE_SIMILAR_PAGE_NEXT_ARIA_LABEL =
  "Next similar releases page";

export const RELEASE_SIMILAR_COUNT_TOOLTIP =
  "Ranked best match first from your collection. We score shared styles (weighted more than genres), overlapping tags, format, label, and nearby release year, and we rank same-artist copies lower so you see different artists with a similar vibe.";

export const formatSimilarReleaseCountLabel = (totalCount: number): string =>
  totalCount === 1 ? "1 similar" : `${totalCount} similar`;

export const formatSimilarReleasePageLabel = (
  pageIndex: number,
  pageCount: number,
): string => `${pageIndex + 1} of ${pageCount}`;

export const getSimilarReleasePageDigitCh = (pageCount: number): number =>
  Math.max(1, String(pageCount).length);
