"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trackReleaseRatingSaved } from "src/analytics/productAnalyticsEvents";
import { clearReleaseRating, updateReleaseRating } from "src/api/helpers";
import { FiltersActionTypes } from "src/atoms/filters.atoms";
import { useAuth } from "src/context/auth.context";
import {
  DiscogsCollectionQueryKeys,
  DiscogsReleaseQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import {
  useAllReleases,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease } from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";

const getReleaseRating = (release: DiscogsRelease): number =>
  typeof release.rating === "number" ? release.rating : 0;

export const useReleaseRatingEditor = (release: DiscogsRelease) => {
  const { state: authState } = useAuth();
  const username = authState.username ?? "";
  const releaseId = parseReleaseId(release);
  const canEdit =
    authState.isAuthenticated && releaseId !== null && username.length > 0;

  const [rating, setRating] = useState(() => getReleaseRating(release));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useFiltersDispatch();
  const allReleases = useAllReleases();
  const queryClient = useQueryClient();

  useEffect(() => {
    setRating(getReleaseRating(release));
  }, [release.rating, release.instance_id]);

  const applyOptimisticRating = (nextRating: number) => {
    const previousReleases = allReleases;
    const optimisticReleases = previousReleases.map((item) =>
      parseReleaseId(item) === releaseId
        ? { ...item, rating: nextRating }
        : item,
    );

    dispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: optimisticReleases,
    });

    return previousReleases;
  };

  const handleRate = async (nextRating: number) => {
    if (!canEdit || releaseId === null || isSaving) {
      return;
    }

    const shouldClear = nextRating === rating && rating > 0;
    const previousRating = rating;
    const optimisticRating = shouldClear ? 0 : nextRating;

    setErrorMessage(null);
    setRating(optimisticRating);
    setIsSaving(true);

    const previousReleases = applyOptimisticRating(optimisticRating);

    try {
      if (shouldClear) {
        await clearReleaseRating({
          username,
          releaseId,
        });
      } else {
        await updateReleaseRating({
          username,
          releaseId,
          rating: nextRating,
        });
      }

      trackReleaseRatingSaved(release.instance_id);
      queryClient.invalidateQueries({
        queryKey: DiscogsCollectionQueryKeys.byUsername(username),
      });
      queryClient.invalidateQueries({
        queryKey: DiscogsReleaseQueryKeys.byId(String(releaseId)),
      });
    } catch (error) {
      setRating(previousRating);
      dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: previousReleases,
      });
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save rating",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    canEdit,
    errorMessage,
    handleRate,
    isSaving,
    rating,
  };
};
