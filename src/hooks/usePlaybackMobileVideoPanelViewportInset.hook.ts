"use client";

import { useCallback, useSyncExternalStore } from "react";
import { resolveVisualViewportBottomInset } from "src/utils/resolveVisualViewportBottomInset";

const readViewportBottomInset = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const viewport = window.visualViewport;

  if (!viewport) {
    return 0;
  }

  return resolveVisualViewportBottomInset(window.innerHeight, {
    height: viewport.height,
    offsetTop: viewport.offsetTop,
  });
};

export const usePlaybackMobileVideoPanelViewportInset = (
  enabled: boolean,
): number => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled || typeof window === "undefined") {
        return () => undefined;
      }

      const notify = () => {
        onStoreChange();
      };

      window.addEventListener("resize", notify);
      window.visualViewport?.addEventListener("resize", notify);
      window.visualViewport?.addEventListener("scroll", notify);

      return () => {
        window.removeEventListener("resize", notify);
        window.visualViewport?.removeEventListener("resize", notify);
        window.visualViewport?.removeEventListener("scroll", notify);
      };
    },
    [enabled],
  );

  const getSnapshot = useCallback(() => {
    if (!enabled) {
      return 0;
    }

    return readViewportBottomInset();
  }, [enabled]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
};
