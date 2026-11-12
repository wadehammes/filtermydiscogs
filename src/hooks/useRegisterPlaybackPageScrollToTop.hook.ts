import { useEffect } from "react";
import { usePlaybackPageScrollToTopRegistration } from "src/components/PlaybackPageShell/PlaybackPageShell.context";

export const useRegisterPlaybackPageNativeScrollToTop = (
  scrollElement: HTMLElement | null,
): void => {
  const registerScrollToTop = usePlaybackPageScrollToTopRegistration();

  useEffect(() => {
    if (!scrollElement) {
      registerScrollToTop(null);
      return undefined;
    }

    registerScrollToTop(() => {
      scrollElement.scrollTo({ top: 0, behavior: "auto" });
    });

    return () => {
      registerScrollToTop(null);
    };
  }, [registerScrollToTop, scrollElement]);
};
