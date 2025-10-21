"use client";

import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { Page } from "src/components/Page/Page.component";
import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { EmptyState } from "./components/EmptyState.component";
import { LoadingTrigger } from "./components/LoadingTrigger.component";
import { ReleasesGrid } from "./components/ReleasesGrid.component";
import { ReleasesHeader } from "./components/ReleasesHeader.component";
import styles from "./ReleasesClient.module.css";

export default function ReleasesClient() {
  const { isDrawerOpen, closeDrawer } = useCrate();
  const {
    // Loading states
    authLoading,
    isLoading,
    hasError,
    error,
    hasReleases,
    isFetchingNextPage,
    showAllLoadedMessage,

    // Data
    filteredReleases,
    releaseCount,
    isRandomMode,

    // UI state
    isMobile,
    viewState,
    highlightedReleaseId,
    isSorting,

    // Refs
    mainContentRef,
    infiniteScrollRef,

    // Callbacks
    handleReleaseClick,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient();

  const loadingProgress = hasReleases
    ? {
        current: isSorting ? 0 : releaseCount,
      }
    : undefined;

  if (authLoading || isLoading) {
    return (
      <Page>
        <StickyHeaderBar allReleasesLoaded={false} />
        <div className={styles.loadingContainer}>
          <ReleasesLoading isLoaded={false} progress={loadingProgress} />
        </div>
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
      <StickyHeaderBar allReleasesLoaded={true} currentPage="releases" />
      <div
        className={`${styles.container} ${isDrawerOpen ? styles.withSidebar : ""}`}
      >
        <div ref={mainContentRef} className={styles.mainContent}>
          {hasReleases && (
            <ReleasesHeader
              releaseCount={releaseCount}
              isFetchingNextPage={isFetchingNextPage}
              showAllLoadedMessage={showAllLoadedMessage}
              isMobile={isMobile}
              isRandomMode={isRandomMode}
              currentView={viewState.currentView}
              onViewChange={handleViewChange}
              onRandomClick={handleRandomClick}
            />
          )}

          {hasReleases ? (
            <ReleasesGrid
              releases={filteredReleases}
              view={viewState.currentView}
              isMobile={isMobile}
              isRandomMode={isRandomMode}
              highlightedReleaseId={highlightedReleaseId}
              onExitRandomMode={handleExitRandomMode}
            />
          ) : (
            <EmptyState />
          )}

          <LoadingTrigger
            isFetchingNextPage={isFetchingNextPage}
            infiniteScrollRef={infiniteScrollRef}
          />
        </div>

        <div className={styles.sidebar}>
          <CrateDrawer
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
            onReleaseClick={handleReleaseClick}
          />
        </div>
      </div>
    </Page>
  );
}
