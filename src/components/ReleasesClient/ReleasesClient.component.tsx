"use client";

import classNames from "classnames";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { Page } from "src/components/Page/Page.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { definedProps } from "src/utils/definedProps";
import { EmptyState } from "./components/EmptyState.component";
import { LoadingTrigger } from "./components/LoadingTrigger.component";
import { ReleasesGrid } from "./components/ReleasesGrid.component";
import { ReleasesHeader } from "./components/ReleasesHeader.component";
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
    hasError,
    error,
    hasReleases,
    isFetchingNextPage,
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

  const loadingProgress = hasReleases
    ? {
        current: releaseCount,
      }
    : undefined;

  const needsCollectionLoad = useNeedsCollectionLoad(isLoading);
  const showLoading = isCheckingAuth || needsCollectionLoad;

  if (shouldRedirectHome) {
    return null;
  }

  if (showLoading) {
    return (
      <Page>
        <AppPageLoading
          currentPage="releases"
          progressText={
            needsCollectionLoad && loadingProgress
              ? `${loadingProgress.current} releases loaded`
              : undefined
          }
        />
      </Page>
    );
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
      <div
        className={classNames({
          [styles.withMiniPlayer]: isPlaying,
        })}
      >
        <StickyHeaderBar allReleasesLoaded={true} currentPage="releases" />
        <div
          className={classNames(styles.container, {
            [styles.withSidebar]: isDrawerOpen,
          })}
        >
          <div ref={mainContentRef} className={styles.mainContent}>
            {hasReleases ? (
              <ReleasesHeader
                releaseCount={releaseCount}
                isFetchingNextPage={isFetchingNextPage}
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
            ) : (
              <EmptyState />
            )}

            <LoadingTrigger
              isFetchingNextPage={isFetchingNextPage}
              infiniteScrollRef={infiniteScrollRef}
            />
            <BackToTop
              {...definedProps({
                className: isPlaying
                  ? styles.backToTopWithMiniPlayer
                  : undefined,
              })}
            />
          </div>

          <div className={styles.sidebar}>
            <CrateDrawer
              isOpen={isDrawerOpen}
              onReleaseClick={handleReleaseClick}
            />
          </div>
        </div>
        {isMobile && activeCrateId ? (
          <button
            type="button"
            className={classNames(styles.crateFab, {
              [styles.crateFabWithMiniPlayer]: isPlaying,
            })}
            onClick={toggleDrawer}
            aria-label={`${isDrawerOpen ? "Close" : "Open"} crate with ${selectedReleases.length} items`}
          >
            <div className={styles.fabContent}>
              <div className={styles.fabMain}>
                <span className={styles.fabMainContent}>
                  {crateName ? <span>{crateName}</span> : <span>Crate</span>}
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
        />
        <ReleaseMiniPlayer
          {...definedProps({ onReleaseClick: handleReleaseClick })}
        />
      </div>
    </Page>
  );
};

export default function ReleasesClient() {
  return (
    <ReleasePlaybackProvider>
      <ReleasesClientContent />
    </ReleasePlaybackProvider>
  );
}
