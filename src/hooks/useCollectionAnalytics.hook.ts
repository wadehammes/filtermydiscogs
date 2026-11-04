import { useDeferredValue, useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import {
  buildCollectionAnalytics,
  buildCollectionAnalyticsDuringTransition,
} from "src/utils/buildCollectionAnalytics";
import { isCollectionAnalyticsTransitionPending } from "src/utils/isCollectionAnalyticsTransitionPending";
import { resolveAnalyticsReleases } from "src/utils/resolveAnalyticsReleases";

export const useCollectionAnalytics = (): CollectionAnalytics | null => {
  const releases = useAllReleases();
  const deferredReleases = useDeferredValue(releases);
  const analyticsReleases = resolveAnalyticsReleases(
    releases,
    deferredReleases,
  );
  const transitionPending = isCollectionAnalyticsTransitionPending(
    releases,
    deferredReleases,
  );

  return useMemo(() => {
    if (!analyticsReleases || analyticsReleases.length === 0) {
      return null;
    }

    if (transitionPending) {
      return buildCollectionAnalyticsDuringTransition(analyticsReleases);
    }

    return buildCollectionAnalytics(analyticsReleases);
  }, [analyticsReleases, transitionPending]);
};
