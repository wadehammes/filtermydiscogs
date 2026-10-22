"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { CollectionSidePanelToggle } from "src/components/CollectionSidePanelToggle/CollectionSidePanelToggle.component";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { ViewToggle } from "src/components/ViewToggle/ViewToggle.component";
import type { CollectionSidePanelMode } from "src/hooks/useCrateDrawer.hook";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import styles from "./ReleasesHeader.module.css";

interface ReleasesHeaderProps {
  releaseCount: number;
  isCollectionLoading: boolean;
  showAllLoadedMessage: boolean;
  isRandomMode: boolean;
  currentView: "card" | "list" | "random";
  onViewChange: (view: "card" | "list" | "random") => void;
  onRandomClick: () => void;
  sidePanel: CollectionSidePanelMode;
  isSidePanelOpen: boolean;
  onSelectSidePanel: (panel: CollectionSidePanelMode) => void;
  playlistsEnabled?: boolean;
  deferSidePanelHighlight?: boolean;
}

export const ReleasesHeader = ({
  releaseCount,
  isCollectionLoading,
  showAllLoadedMessage,
  isRandomMode,
  currentView,
  onViewChange,
  onRandomClick,
  sidePanel,
  isSidePanelOpen,
  onSelectSidePanel,
  playlistsEnabled = true,
  deferSidePanelHighlight = false,
}: ReleasesHeaderProps) => {
  const [isStuck, setIsStuck] = useState(false);
  const scrollElement = usePlaybackPageScrollElement();

  useEffect(() => {
    const getScrollY = () =>
      scrollElement
        ? scrollElement.scrollTop
        : window.scrollY || document.documentElement.scrollTop;

    const updateStuck = () => {
      setIsStuck(getScrollY() > 0);
    };

    updateStuck();

    const scrollTarget: HTMLElement | Window = scrollElement ?? window;
    scrollTarget.addEventListener("scroll", updateStuck, { passive: true });

    return () => {
      scrollTarget.removeEventListener("scroll", updateStuck);
    };
  }, [scrollElement]);

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
          <p
            role="status"
            aria-live="polite"
            className={styles.releaseCount}
            aria-label={`Showing ${releaseCount} releases`}
          >
            Showing {releaseCount} releases
          </p>
        )}
        {showLoadingMore ? (
          <span className={styles.loadingIcon} role="status" aria-live="polite">
            <Spinner size="xs" aria-label="Loading more" />
            <span>Loading more...</span>
          </span>
        ) : null}
        {!isCollectionLoading && showAllLoadedMessage ? (
          <span className={styles.loadingIcon} role="status" aria-live="polite">
            <CheckThinIcon aria-hidden />
            <span>All releases loaded</span>
          </span>
        ) : null}
      </div>
      <div className={styles.headerControls}>
        <ViewToggle
          currentView={isRandomMode ? "random" : currentView}
          onViewChange={onViewChange}
          onRandomClick={onRandomClick}
          className={classNames(styles.viewToggleDesktop)}
        />
        <CollectionSidePanelToggle
          sidePanel={sidePanel}
          isDrawerOpen={isSidePanelOpen}
          onSelectSidePanel={onSelectSidePanel}
          playlistsEnabled={playlistsEnabled}
          deferSegmentHighlight={deferSidePanelHighlight}
        />
      </div>
    </div>
  );
};
