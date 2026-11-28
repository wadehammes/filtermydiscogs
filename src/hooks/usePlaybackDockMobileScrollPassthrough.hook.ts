"use client";

import { type RefObject, useEffect } from "react";
import { blurFocusWithinPlaybackDock } from "src/utils/playbackDockFocus";

interface UsePlaybackDockMobileScrollPassthroughParams {
  miniPlayerBarRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}

export const usePlaybackDockMobileScrollPassthrough = ({
  miniPlayerBarRef,
  enabled,
}: UsePlaybackDockMobileScrollPassthroughParams) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const miniPlayerBar = miniPlayerBarRef.current;

    if (!miniPlayerBar) {
      return undefined;
    }

    const onTouchStart = () => {
      blurFocusWithinPlaybackDock();
    };

    miniPlayerBar.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });

    return () => {
      miniPlayerBar.removeEventListener("touchstart", onTouchStart, {
        capture: true,
      });
    };
  }, [enabled, miniPlayerBarRef]);
};
