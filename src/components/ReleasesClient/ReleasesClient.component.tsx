"use client";

import classNames from "classnames";
import { useState } from "react";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CrateDrawerLazy } from "src/components/CrateDrawer/CrateDrawerLazy.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { ReleaseModalLazyOverlay } from "src/components/ReleaseModal/ReleaseModalLazyOverlay.component";
import { useCrate } from "src/context/crate.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { useOfferPendingFiltersRestore } from "src/hooks/useOfferPendingFiltersRestore.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { definedProps } from "src/utils/definedProps";
import { EmptyState } from "./EmptyState.component";
import { LoadingTrigger } from "./LoadingTrigger.component";
import styles from "./ReleasesClient.module.css";
import { ReleasesGrid } from "./ReleasesGrid.component";
import { ReleasesHeader } from "./ReleasesHeader.component";
import { ReleasesSkeleton } from "./ReleasesSkeleton.component";

const ReleasesClientContent = () => {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const {
    isDrawerOpen,
    toggleDrawer,
    selectedReleases,
    crates,
    activeCrateId,
  } = useCrate();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name;
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

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
    isFilterPending,
    selectedRelease,
    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient();

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const allReleasesLoaded = !(isLoading || hasNextPage || isFetchingNextPage);
  useOfferPendingFiltersRestore(allReleasesLoaded);

  if (shouldRedirectHome) {
    return null;
  }

  if (isCheckingAuth) {
    return <AppPageLoading currentPage="releases" />;
  }

  if (hasError) {
    return (
      <Page>
        <CollectionPlaybackPageShell
          allReleasesLoaded={false}
          currentPage="releases"
        >
          <div className={styles.errorContainer}>
            <h2>Error loading collection</h2>
            <p>{error}</p>
          </div>
        </CollectionPlaybackPageShell>
      </Page>
    );
  }

  return (
    <Page>
      <CollectionPlaybackPageShell
        allReleasesLoaded={allReleasesLoaded}
        currentPage="releases"
        mainClassName={styles.shellMain}
        scrollElement={scrollRoot}
        overlays={
          <>
            {isMobile && activeCrateId ? (
              <button
                type="button"
                className={styles.crateFab}
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
            <BackToTop />
            <ReleaseModalLazyOverlay
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
              ref={setScrollRoot}
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
                <div
                  {...definedProps({
                    "aria-busy": isFilterPending ? true : undefined,
                  })}
                  aria-live="polite"
                >
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
                </div>
              ) : !allReleasesLoaded ? (
                <ReleasesSkeleton isMobile={isMobile} />
              ) : (
                <EmptyState />
              )}

              <LoadingTrigger isFetchingNextPage={isFetchingNextPage} />
            </div>

            <div className={styles.sidebar}>
              {isDrawerOpen ? (
                <CrateDrawerLazy
                  isOpen={isDrawerOpen}
                  onReleaseClick={handleReleaseClick}
                  aboveMiniPlayer={isMiniPlayerVisible}
                />
              ) : null}
            </div>
          </div>
        </div>
      </CollectionPlaybackPageShell>
    </Page>
  );
};

export default function ReleasesClient() {
  return <ReleasesClientContent />;
}
