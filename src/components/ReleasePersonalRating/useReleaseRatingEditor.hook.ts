"use client";

import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trackReleaseRatingSaved } from "src/analytics/productAnalyticsEvents";
import { clearReleaseRating, updateReleaseRating } from "src/api/helpers";
import { useAuth } from "src/context/auth.context";
import {
  DiscogsCollectionQueryKeys,
  DiscogsReleaseQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { DiscogsCollection, DiscogsRelease } from "src/types";
import {
  patchCollectionQueryReleaseRating,
  patchPersistedCollectionReleaseRating,
} from "src/utils/collectionCacheSync";
import type { CollectionPageParam } from "src/utils/collectionPagination";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    setRating(getReleaseRating(release));
  }, [release]);

  const handleRate = async (nextRating: number) => {
    if (!canEdit || releaseId === null || isSaving) {
      return;
    }

    const shouldClear = nextRating === rating && rating > 0;
    const previousRating = rating;
    const optimisticRating = shouldClear ? 0 : nextRating;
    const collectionQueryKey = DiscogsCollectionQueryKeys.byUsername(username);
    const previousQueryData =
      queryClient.getQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey);

    setErrorMessage(null);
    setRating(optimisticRating);
    setIsSaving(true);

    queryClient.setQueryData<
      InfiniteData<DiscogsCollection, CollectionPageParam>
    >(collectionQueryKey, (current) =>
      patchCollectionQueryReleaseRating(current, releaseId, optimisticRating),
    );

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
      await patchPersistedCollectionReleaseRating(
        username,
        releaseId,
        optimisticRating,
      );
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: DiscogsReleaseQueryKeys.byId(String(releaseId)),
      });
    } catch (error) {
      setRating(previousRating);
      queryClient.setQueryData(collectionQueryKey, previousQueryData);
      await patchPersistedCollectionReleaseRating(
        username,
        releaseId,
        previousRating,
      );
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
