import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { DiscogsRelease } from "src/types";
import { prefetchReleaseOpenData } from "src/utils/prefetchReleaseOpenData";
import { parseReleaseId } from "src/utils/releaseNotes";
import {
  clearScheduledReleaseOpenHoverPrefetch,
  scheduleReleaseOpenHoverPrefetch,
} from "src/utils/releaseOpenPrefetch";

export { RELEASE_OPEN_PREFETCH_HOVER_MS } from "src/constants/releaseOpenPrefetch";

interface UseReleaseOpenHandlerParams {
  release: DiscogsRelease | null | undefined;
  onReleaseClick?: ((instanceId: string) => void) | undefined;
}

export const useReleaseOpenHandler = ({
  release,
  onReleaseClick,
}: UseReleaseOpenHandlerParams) => {
  const queryClient = useQueryClient();
  const releaseIdRef = useRef<string | null>(null);

  releaseIdRef.current =
    release === null || release === undefined
      ? null
      : (() => {
          const releaseId = parseReleaseId(release);
          return releaseId === null ? null : String(releaseId);
        })();

  const clearHoverPrefetch = useCallback(() => {
    const releaseId = releaseIdRef.current;

    if (releaseId === null) {
      clearScheduledReleaseOpenHoverPrefetch();
      return;
    }

    clearScheduledReleaseOpenHoverPrefetch(releaseId);
  }, []);

  const prefetchReleaseOpen = useCallback(() => {
    if (!(onReleaseClick && release)) {
      return;
    }

    clearScheduledReleaseOpenHoverPrefetch();
    prefetchReleaseOpenData(queryClient, release, {
      cancelOtherFetches: true,
    });
  }, [onReleaseClick, queryClient, release]);

  const schedulePrefetchReleaseOpen = useCallback(() => {
    if (!(onReleaseClick && release)) {
      return;
    }

    const releaseId = releaseIdRef.current;

    if (releaseId === null) {
      return;
    }

    scheduleReleaseOpenHoverPrefetch(releaseId, () => {
      prefetchReleaseOpenData(queryClient, release, {
        cancelOtherFetches: true,
      });
    });
  }, [onReleaseClick, queryClient, release]);

  useEffect(() => clearHoverPrefetch, [clearHoverPrefetch]);

  const openRelease = useCallback(() => {
    if (!release) {
      return;
    }

    onReleaseClick?.(String(release.instance_id));
  }, [onReleaseClick, release]);

  const canOpen =
    onReleaseClick !== undefined && release !== null && release !== undefined;

  const prefetchPointerProps = canOpen
    ? {
        onPointerEnter: schedulePrefetchReleaseOpen,
        onPointerLeave: clearHoverPrefetch,
        onPointerDown: prefetchReleaseOpen,
      }
    : undefined;

  return {
    openRelease,
    prefetchReleaseOpen,
    schedulePrefetchReleaseOpen,
    cancelPrefetchReleaseOpen: clearHoverPrefetch,
    prefetchPointerProps,
    canOpen,
  };
};
