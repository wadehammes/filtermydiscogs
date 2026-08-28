"use client";

import { useEffect, useState } from "react";
import { useAuth } from "src/context/auth.context";
import { useSaveReleaseRatingMutation } from "src/hooks/mutations/useCollectionMutations";
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
  const saveRatingMutation = useSaveReleaseRatingMutation({ username });

  const releaseRating = getReleaseRating(release);

  useEffect(() => {
    setRating(releaseRating);
  }, [release.instance_id, releaseRating]);

  const handleRate = async (nextRating: number) => {
    if (!canEdit || releaseId === null || saveRatingMutation.isPending) {
      return;
    }

    const shouldClear = nextRating === rating && rating > 0;
    const optimisticRating = shouldClear ? 0 : nextRating;
    const previousRating = rating;

    setErrorMessage(null);
    setRating(optimisticRating);

    try {
      await saveRatingMutation.mutateAsync({
        releaseId,
        instanceId: String(release.instance_id),
        nextRating: optimisticRating,
        shouldClear,
      });
    } catch (error) {
      setRating(previousRating);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save rating",
      );
    }
  };

  return {
    canEdit,
    errorMessage,
    handleRate,
    isSaving: saveRatingMutation.isPending,
    rating,
  };
};
