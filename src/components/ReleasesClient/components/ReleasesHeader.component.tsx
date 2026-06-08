"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { ViewToggle } from "src/components/ViewToggle/ViewToggle.component";
import Check from "src/styles/icons/check-solid.svg";
import styles from "./ReleasesHeader.module.css";

interface ReleasesHeaderProps {
  releaseCount: number;
  isFetchingNextPage: boolean;
  showAllLoadedMessage: boolean;
  isMobile: boolean;
  isRandomMode: boolean;
  currentView: "card" | "list" | "random";
  onViewChange: (view: "card" | "list" | "random") => void;
  onRandomClick: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
}

export const ReleasesHeader = ({
  releaseCount,
  isFetchingNextPage,
  showAllLoadedMessage,
  isMobile,
  isRandomMode,
  currentView,
  onViewChange,
  onRandomClick,
  onCratesClick,
  isCratesOpen,
}: ReleasesHeaderProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry ? !entry.isIntersecting : false);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className={styles.stickySentinel} aria-hidden />
      <div
        className={classNames(styles.releasesHeader, {
          [styles.stuck as string]: isStuck,
        })}
      >
        <div className={styles.headerText}>
          Showing {releaseCount} releases
          {isFetchingNextPage && (
            <span className={styles.loadingIcon}>
              <Spinner size="xs" aria-label="Loading more" />
              <span>Loading more...</span>
            </span>
          )}
          {showAllLoadedMessage && (
            <span className={styles.loadingIcon}>
              <Check />
              <span>All releases loaded</span>
            </span>
          )}
        </div>
        <ViewToggle
          currentView={isRandomMode ? "random" : currentView}
          onViewChange={onViewChange}
          onRandomClick={onRandomClick}
          {...(isMobile ? { className: styles.viewToggleMobile } : {})}
          {...(onCratesClick && { onCratesClick, isCratesOpen })}
        />
      </div>
    </>
  );
};
