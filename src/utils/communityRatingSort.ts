import { SortValues } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";

export const isCommunityRatingSort = (sort: SortValues): boolean => {
  return (
    sort === SortValues.CommunityRatingHigh ||
    sort === SortValues.CommunityRatingLow
  );
};

export const getCommunityRatingReleaseId = (
  release: DiscogsRelease,
): string | null => {
  const releaseId = parseReleaseId(release);

  return releaseId !== null ? String(releaseId) : null;
};

export const getCommunityRatingSortValue = ({
  release,
  communityRatingsByReleaseId,
  sort,
}: {
  release: DiscogsRelease;
  communityRatingsByReleaseId: Record<string, number | null>;
  sort: SortValues.CommunityRatingHigh | SortValues.CommunityRatingLow;
}): number => {
  const releaseId = getCommunityRatingReleaseId(release);

  if (!(releaseId && releaseId in communityRatingsByReleaseId)) {
    return sort === SortValues.CommunityRatingHigh
      ? Number.NEGATIVE_INFINITY
      : Number.POSITIVE_INFINITY;
  }

  return communityRatingsByReleaseId[releaseId] ?? 0;
};

export const parseCommunityRatingAverage = (
  payload: unknown,
): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const rating = (payload as { rating?: { average?: number; count?: number } })
    .rating;

  if (
    !rating ||
    typeof rating.average !== "number" ||
    rating.average <= 0 ||
    !rating.count
  ) {
    return null;
  }

  return rating.average;
};
