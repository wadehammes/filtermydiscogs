import { useInView } from "react-intersection-observer";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";

export const SCROLL_REVEAL_THRESHOLD = 0.5;

interface UseScrollRevealInViewOptions {
  skip?: boolean;
  threshold?: number;
}

export const useScrollRevealInView = ({
  skip = false,
  threshold = SCROLL_REVEAL_THRESHOLD,
}: UseScrollRevealInViewOptions = {}) => {
  const scrollElement = usePlaybackPageScrollElement();

  const observer = useInView({
    root: scrollElement,
    rootMargin: "0px",
    threshold,
    triggerOnce: true,
    skip,
  });

  return observer;
};
