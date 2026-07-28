"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { ViewToggle } from "src/components/ViewToggle/ViewToggle.component";
import Check from "src/styles/icons/check-thin.svg";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleasesHeader.module.css";

interface ReleasesHeaderProps {
  releaseCount: number;
  isCollectionLoading: boolean;
  showAllLoadedMessage: boolean;
  isRandomMode: boolean;
  currentView: "card" | "list" | "random";
  onViewChange: (view: "card" | "list" | "random") => void;
  onRandomClick: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
}

export const ReleasesHeader = ({
  releaseCount,
  isCollectionLoading,
  showAllLoadedMessage,
  isRandomMode,
  currentView,
  onViewChange,
  onRandomClick,
  onCratesClick,
  isCratesOpen,
}: ReleasesHeaderProps) => {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const updateStuck = () => {
      setIsStuck(window.scrollY > 0);
    };

    updateStuck();
    window.addEventListener("scroll", updateStuck, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateStuck);
    };
  }, []);

  const showInitialLoading = isCollectionLoading && releaseCount === 0;
  const showLoadingMore = isCollectionLoading && releaseCount > 0;

  return (
    <div
      className={classNames(styles.releasesHeader, {
        [styles.stuck]: isStuck,
      })}
    >
      <div className={styles.headerText}>
        {showInitialLoading ? (
          <span className={styles.loadingIcon}>
            <Spinner size="xs" aria-label="Loading releases" />
            <span>Loading releases...</span>
          </span>
        ) : (
          <>Showing {releaseCount} releases</>
        )}
        {showLoadingMore ? (
          <span className={styles.loadingIcon}>
            <Spinner size="xs" aria-label="Loading more" />
            <span>Loading more...</span>
          </span>
        ) : null}
        {!isCollectionLoading && showAllLoadedMessage ? (
          <span className={styles.loadingIcon}>
            <Check />
            <span>All releases loaded</span>
          </span>
        ) : null}
      </div>
      <ViewToggle
        currentView={isRandomMode ? "random" : currentView}
        onViewChange={onViewChange}
        onRandomClick={onRandomClick}
        className={classNames(styles.viewToggleMobile)}
        {...definedProps({ onCratesClick, isCratesOpen })}
      />
    </div>
  );
};
