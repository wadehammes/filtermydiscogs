"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import {
  usePlaybackPageScrollElement,
  usePlaybackPageScrollToTop,
} from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import styles from "./BackToTop.module.css";

const SCROLL_THRESHOLD = 400;

interface BackToTopProps {
  className?: string;
}

export const BackToTop = ({ className }: BackToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const scrollElement = usePlaybackPageScrollElement();
  const handleScrollToTop = usePlaybackPageScrollToTop();

  useEffect(() => {
    const getScrollY = () =>
      scrollElement
        ? scrollElement.scrollTop
        : window.scrollY || document.documentElement.scrollTop;

    const handleScroll = () => {
      setIsVisible(getScrollY() > SCROLL_THRESHOLD);
    };

    handleScroll();

    const scrollTarget: HTMLElement | Window = scrollElement ?? window;
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, [scrollElement]);

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      className={classNames(styles.backToTop, className, {
        [styles.visible]: isVisible,
      })}
      data-testid="fmdBackToTop"
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
      <span className={styles.label}>Back to top</span>
    </button>
  );
};
