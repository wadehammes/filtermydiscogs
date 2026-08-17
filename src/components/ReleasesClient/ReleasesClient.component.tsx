"use client";

import classNames from "classnames";
import { useCallback, useState } from "react";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { Page } from "src/components/Page/Page.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { PlaybackPageShell } from "src/components/ReleasePlayback/PlaybackPageShell.component";
import { PlaybackScrollSpacer } from "src/components/ReleasePlayback/PlaybackScrollSpacer.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useOfferPendingFiltersRestore } from "src/hooks/useOfferPendingFiltersRestore.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { EmptyState } from "./components/EmptyState.component";
import { LoadingTrigger } from "./components/LoadingTrigger.component";
import { ReleasesGrid } from "./components/ReleasesGrid.component";
import { ReleasesHeader } from "./components/ReleasesHeader.component";
import { ReleasesSkeleton } from "./components/ReleasesSkeleton.component";
import styles from "./ReleasesClient.module.css";

const ReleasesClientContent = () => {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const {
    isDrawerOpen,
    toggleDrawer,
    selectedReleases,
    crates,
    activeCrateId,
  } = useCrate();
  const { isPlaying } = useReleasePlayback();
  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name;
  const {
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    hasError,
    error,
    hasReleases,
    showAllLoadedMessage,
    visibleReleases,
    releaseCount,
    isRandomMode,
    randomRelease,
    isMobile,
    currentView,
    mainContentRef,
    infiniteScrollRef,
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient();

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const allReleasesLoaded = !(isLoading || hasNextPage || isFetchingNextPage);
  useOfferPendingFiltersRestore(allReleasesLoaded);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const setMainContentNode = useCallback(
    (node: HTMLDivElement | null) => {
      mainContentRef.current = node;
      setScrollRoot(node);
    },
    [mainContentRef],
  );

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  if (hasError) {
    return (
      <Page>
        <StickyHeaderBar allReleasesLoaded={false} />
        <div className={styles.errorContainer}>
          <h2>Error loading collection</h2>
          <p>{error}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PlaybackPageShell
        fillViewport
        mainClassName={styles.shellMain}
        scrollElement={scrollRoot}
        header={
          <StickyHeaderBar
            allReleasesLoaded={allReleasesLoaded}
            currentPage="releases"
          />
        }
        overlays={
          <>
            {isMobile && activeCrateId ? (
              <button
                type="button"
                className={classNames(styles.crateFab, {
                  [styles.crateFabAboveDock]: isPlaying,
                })}
                onClick={toggleDrawer}
                aria-label={`${isDrawerOpen ? "Close" : "Open"} crate with ${selectedReleases.length} items`}
              >
                <div className={styles.fabContent}>
                  <div className={styles.fabMain}>
                    <span className={styles.fabMainContent}>
                      {crateName ? (
                        <span>{crateName}</span>
                      ) : (
                        <span>Crate</span>
                      )}
                    </span>
                    <span className={styles.fabCount}>
                      {selectedReleases.length}
                    </span>
                  </div>
                </div>
              </button>
            ) : null}
            <ReleaseModal
              isOpen={selectedReleaseId !== null}
              release={selectedRelease}
              onClose={handleCloseModal}
              onReleaseClick={handleReleaseClick}
            />
          </>
        }
      >
        <div
          className={classNames(styles.container, {
            [styles.withSidebar]: isDrawerOpen,
          })}
          data-releases-workspace
        >
          <div className={styles.workspaceRow}>
            <div
              ref={setMainContentNode}
              className={styles.mainContent}
              data-releases-scroll-root
            >
              {hasReleases || !allReleasesLoaded ? (
                <ReleasesHeader
                  releaseCount={releaseCount}
                  isCollectionLoading={!allReleasesLoaded}
                  showAllLoadedMessage={showAllLoadedMessage}
                  isRandomMode={isRandomMode}
                  currentView={currentView}
                  onViewChange={handleViewChange}
                  onRandomClick={handleRandomClick}
                  onCratesClick={toggleDrawer}
                  isCratesOpen={isDrawerOpen}
                />
              ) : null}

              {hasReleases ? (
                <ReleasesGrid
                  releases={visibleReleases}
                  view={currentView}
                  isMobile={isMobile}
                  isRandomMode={isRandomMode}
                  onExitRandomMode={handleExitRandomMode}
                  onRandomClick={handleRandomClick}
                  onReleaseClick={handleReleaseClick}
                  randomRelease={randomRelease}
                />
              ) : !allReleasesLoaded ? (
                <ReleasesSkeleton isMobile={isMobile} />
              ) : (
                <EmptyState />
              )}

              <LoadingTrigger
                isFetchingNextPage={isFetchingNextPage}
                infiniteScrollRef={infiniteScrollRef}
              />
              <BackToTop aboveDock={isPlaying} />
              <PlaybackScrollSpacer />
            </div>

            <div className={styles.sidebar}>
              <CrateDrawer
                isOpen={isDrawerOpen}
                onReleaseClick={handleReleaseClick}
                aboveMiniPlayer={isPlaying}
              />
            </div>
          </div>
        </div>
      </PlaybackPageShell>
    </Page>
  );
};

export default function ReleasesClient() {
  return <ReleasesClientContent />;
}
