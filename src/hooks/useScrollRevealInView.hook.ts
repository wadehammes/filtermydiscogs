import { useInView } from "react-intersection-observer";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";

export const SCROLL_REVEAL_THRESHOLD = 0.5;
export const SCROLL_REVEAL_ONCE_THRESHOLD = 0.08;
export const SCROLL_REVEAL_ONCE_ROOT_MARGIN = "0px 0px 120px 0px";

interface UseScrollRevealInViewOptions {
  skip?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useScrollRevealInView = ({
  skip = false,
  threshold = SCROLL_REVEAL_THRESHOLD,
  rootMargin = "0px",
}: UseScrollRevealInViewOptions = {}) => {
  const scrollElement = usePlaybackPageScrollElement();

  const observer = useInView({
    root: scrollElement,
    rootMargin,
    threshold,
    triggerOnce: true,
    skip,
  });

  return observer;
};
