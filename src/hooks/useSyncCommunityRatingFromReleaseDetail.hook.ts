import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { communityRatingsByReleaseIdAtom } from "src/atoms/communityRatings.atoms";
import type { DiscogsReleaseDetail } from "src/types";
import { upsertCommunityRatingCache } from "src/utils/communityRatingsStorage";
import { getCommunityRatingFromReleaseDetail } from "src/utils/releaseDisplay";

export const useSyncCommunityRatingFromReleaseDetail = ({
  releaseId,
  releaseDetail,
}: {
  releaseId: number | null;
  releaseDetail: DiscogsReleaseDetail | undefined;
}): void => {
  const setCommunityRatings = useSetAtom(communityRatingsByReleaseIdAtom);

  useEffect(() => {
    if (releaseId === null || !releaseDetail) {
      return;
    }

    const releaseIdKey = String(releaseId);
    const communityRating = getCommunityRatingFromReleaseDetail(releaseDetail);
    const average = communityRating?.average ?? null;

    setCommunityRatings((current) => {
      if (releaseIdKey in current) {
        return current;
      }

      return upsertCommunityRatingCache(releaseIdKey, average);
    });
  }, [releaseDetail, releaseId, setCommunityRatings]);
};
