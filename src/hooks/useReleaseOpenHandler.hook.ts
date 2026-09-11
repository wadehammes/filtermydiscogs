import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { DiscogsRelease } from "src/types";
import { prefetchReleaseOpenData } from "src/utils/prefetchReleaseOpenData";

export const RELEASE_OPEN_PREFETCH_HOVER_MS = 100;

interface UseReleaseOpenHandlerParams {
  release: DiscogsRelease;
  onReleaseClick?: ((instanceId: string) => void) | undefined;
}

export const useReleaseOpenHandler = ({
  release,
  onReleaseClick,
}: UseReleaseOpenHandlerParams) => {
  const queryClient = useQueryClient();
  const hoverPrefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearHoverPrefetch = useCallback(() => {
    if (hoverPrefetchTimeoutRef.current !== null) {
      clearTimeout(hoverPrefetchTimeoutRef.current);
      hoverPrefetchTimeoutRef.current = null;
    }
  }, []);

  const prefetchReleaseOpen = useCallback(() => {
    if (!onReleaseClick) {
      return;
    }

    prefetchReleaseOpenData(queryClient, release);
  }, [onReleaseClick, queryClient, release]);

  const schedulePrefetchReleaseOpen = useCallback(() => {
    if (!onReleaseClick) {
      return;
    }

    clearHoverPrefetch();
    hoverPrefetchTimeoutRef.current = setTimeout(() => {
      hoverPrefetchTimeoutRef.current = null;
      prefetchReleaseOpenData(queryClient, release);
    }, RELEASE_OPEN_PREFETCH_HOVER_MS);
  }, [clearHoverPrefetch, onReleaseClick, queryClient, release]);

  useEffect(() => clearHoverPrefetch, [clearHoverPrefetch]);

  const openRelease = useCallback(() => {
    onReleaseClick?.(String(release.instance_id));
  }, [onReleaseClick, release.instance_id]);

  return {
    openRelease,
    prefetchReleaseOpen,
    schedulePrefetchReleaseOpen,
    cancelPrefetchReleaseOpen: clearHoverPrefetch,
    canOpen: onReleaseClick !== undefined,
  };
};
