import type { QueryClient } from "@tanstack/react-query";
import { RELEASE_OPEN_PREFETCH_HOVER_MS } from "src/constants/releaseOpenPrefetch";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";

let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
let scheduledHoverReleaseId: string | null = null;

export const getScheduledHoverReleaseId = (): string | null =>
  scheduledHoverReleaseId;

export const clearScheduledReleaseOpenHoverPrefetch = (
  releaseId?: string,
): void => {
  if (releaseId !== undefined && scheduledHoverReleaseId !== releaseId) {
    return;
  }

  if (hoverTimeout !== null) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }

  scheduledHoverReleaseId = null;
};

export const scheduleReleaseOpenHoverPrefetch = (
  releaseId: string,
  run: () => void,
): void => {
  clearScheduledReleaseOpenHoverPrefetch();
  scheduledHoverReleaseId = releaseId;
  hoverTimeout = setTimeout(() => {
    hoverTimeout = null;
    run();
  }, RELEASE_OPEN_PREFETCH_HOVER_MS);
};

export const cancelInFlightDiscogsReleasePrefetches = (
  queryClient: QueryClient,
  exceptReleaseId?: string,
): void => {
  void queryClient.cancelQueries({
    queryKey: DiscogsReleaseQueryKeys.all(),
    predicate: (query) => {
      if (query.state.fetchStatus !== "fetching") {
        return false;
      }

      const releaseId = query.queryKey[1];

      return exceptReleaseId === undefined || releaseId !== exceptReleaseId;
    },
  });
};
