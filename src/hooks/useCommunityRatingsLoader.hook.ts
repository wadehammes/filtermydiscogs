import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { getApiFetchErrorStatus } from "src/api/apiFetchError";
import { fetchDiscogsReleaseCommunityRating } from "src/api/helpers";
import {
  communityRatingsByReleaseIdAtom,
  isLoadingCommunityRatingsAtom,
} from "src/atoms/communityRatings.atoms";
import {
  collectionFiltersActiveAtom,
  searchQueryAtom,
  selectedFormatsAtom,
  selectedSortAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  styleOperatorAtom,
} from "src/atoms/filters.atoms";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import {
  getCommunityRatingReleaseId,
  isCommunityRatingSort,
  parseCommunityRatingAverage,
} from "src/utils/communityRatingSort";
import {
  COMMUNITY_RATINGS_REQUEST_INTERVAL_MS,
  isCommunityRatingsRateLimited,
  pauseCommunityRatingsLoader,
} from "src/utils/communityRatingsLoaderState";
import { upsertCommunityRatingCache } from "src/utils/communityRatingsStorage";
import { filterReleases } from "src/utils/filterReleases";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const useCommunityRatingsLoader = (): void => {
  const selectedSort = useAtomValue(selectedSortAtom);
  const allReleases = useAllReleases();
  const collectionFiltersActive = useAtomValue(collectionFiltersActiveAtom);
  const selectedStyles = useAtomValue(selectedStylesAtom);
  const selectedYears = useAtomValue(selectedYearsAtom);
  const selectedFormats = useAtomValue(selectedFormatsAtom);
  const searchQuery = useAtomValue(searchQueryAtom);
  const styleOperator = useAtomValue(styleOperatorAtom);
  const communityRatings = useAtomValue(communityRatingsByReleaseIdAtom);
  const setCommunityRatings = useSetAtom(communityRatingsByReleaseIdAtom);
  const setIsLoadingCommunityRatings = useSetAtom(
    isLoadingCommunityRatingsAtom,
  );
  const ratingsRef = useRef(communityRatings);
  const loaderRunIdRef = useRef(0);

  ratingsRef.current = communityRatings;

  useEffect(() => {
    if (!(collectionFiltersActive && isCommunityRatingSort(selectedSort))) {
      setIsLoadingCommunityRatings(false);
      return;
    }

    if (isCommunityRatingsRateLimited()) {
      setIsLoadingCommunityRatings(false);
      return;
    }

    const filteredReleases = filterReleases({
      releases: allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
      styleOperator,
    });

    const pendingReleaseIds = [
      ...new Set(
        filteredReleases
          .map(getCommunityRatingReleaseId)
          .filter((releaseId): releaseId is string => releaseId !== null),
      ),
    ].filter((releaseId) => !(releaseId in ratingsRef.current));

    if (pendingReleaseIds.length === 0) {
      setIsLoadingCommunityRatings(false);
      return;
    }

    const runId = ++loaderRunIdRef.current;
    let cancelled = false;

    const loadCommunityRatings = async () => {
      setIsLoadingCommunityRatings(true);

      for (const releaseId of pendingReleaseIds) {
        if (cancelled || runId !== loaderRunIdRef.current) {
          break;
        }

        if (isCommunityRatingsRateLimited()) {
          break;
        }

        if (releaseId in ratingsRef.current) {
          continue;
        }

        try {
          const payload = await fetchDiscogsReleaseCommunityRating(releaseId);
          const average = parseCommunityRatingAverage(payload);

          if (cancelled || runId !== loaderRunIdRef.current) {
            break;
          }

          const nextCache = upsertCommunityRatingCache(releaseId, average);
          ratingsRef.current = nextCache;
          setCommunityRatings(nextCache);
        } catch (error) {
          if (cancelled || runId !== loaderRunIdRef.current) {
            break;
          }

          const status = getApiFetchErrorStatus(error);

          if (status === 429) {
            pauseCommunityRatingsLoader();
            break;
          }

          if (status === 404) {
            const nextCache = upsertCommunityRatingCache(releaseId, null);
            ratingsRef.current = nextCache;
            setCommunityRatings(nextCache);
          }
        }

        if (
          !cancelled &&
          runId === loaderRunIdRef.current &&
          !isCommunityRatingsRateLimited()
        ) {
          await sleep(COMMUNITY_RATINGS_REQUEST_INTERVAL_MS);
        }
      }

      if (!cancelled && runId === loaderRunIdRef.current) {
        setIsLoadingCommunityRatings(false);
      }
    };

    void loadCommunityRatings();

    return () => {
      cancelled = true;
    };
  }, [
    allReleases,
    collectionFiltersActive,
    searchQuery,
    selectedFormats,
    selectedSort,
    selectedStyles,
    selectedYears,
    setCommunityRatings,
    setIsLoadingCommunityRatings,
    styleOperator,
  ]);
};
