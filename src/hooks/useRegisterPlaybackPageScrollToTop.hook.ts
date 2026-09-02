import type { Virtualizer } from "@tanstack/react-virtual";
import { useEffect } from "react";
import { usePlaybackPageScrollToTopRegistration } from "src/components/PlaybackPageShell/PlaybackPageShell.context";

export const useRegisterPlaybackPageScrollToTop = (
  rowVirtualizer: Virtualizer<HTMLElement, Element>,
  enabled: boolean,
): void => {
  const registerScrollToTop = usePlaybackPageScrollToTopRegistration();

  useEffect(() => {
    if (!enabled) {
      registerScrollToTop(null);
      return undefined;
    }

    registerScrollToTop(() => {
      rowVirtualizer.scrollToIndex(0, {
        align: "start",
        behavior: "auto",
      });
    });

    return () => {
      registerScrollToTop(null);
    };
  }, [enabled, registerScrollToTop, rowVirtualizer]);
};
