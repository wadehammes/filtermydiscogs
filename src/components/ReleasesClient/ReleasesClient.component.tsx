"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import Login from "src/components/Login/Login.component";
import { Page } from "src/components/Page/Page.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { EmptyState } from "./components/EmptyState.component";
import { LoadingTrigger } from "./components/LoadingTrigger.component";
import { ReleasesGrid } from "./components/ReleasesGrid.component";
import { ReleasesHeader } from "./components/ReleasesHeader.component";
import styles from "./ReleasesClient.module.css";

export default function ReleasesClient() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const {
    isDrawerOpen,
    toggleDrawer,
    selectedReleases,
    crates,
    activeCrateId,
  } = useCrate();
  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name;
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
    visibleReleases,
    releaseCount,
    isRandomMode,
    randomRelease,

    // UI state
    isMobile,
    viewState,

    // Refs
    mainContentRef,
    infiniteScrollRef,

    // Modal state
    selectedRelease,
    selectedReleaseId,

    // Callbacks
    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient();

  useEffect(() => {
    if (!(authState.isLoading || authState.isAuthenticated)) {
      router.replace("/");
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

  const loadingProgress = hasReleases
    ? {
        current: releaseCount,
      }
    : undefined;

  if (!(authState.isAuthenticated || authState.isLoading)) {
    return <Login />;
  }

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
        className={classNames(styles.container, {
          [styles.withSidebar as string]: isDrawerOpen,
        })}
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
              onCratesClick={toggleDrawer}
              isCratesOpen={isDrawerOpen}
            />
          )}

          {hasReleases ? (
            <ReleasesGrid
              releases={visibleReleases}
              view={viewState.currentView}
              isMobile={isMobile}
              isRandomMode={isRandomMode}
              onExitRandomMode={handleExitRandomMode}
              onRandomClick={handleRandomClick}
              randomRelease={randomRelease}
            />
          ) : (
            <EmptyState />
          )}

          <LoadingTrigger
            isFetchingNextPage={isFetchingNextPage}
            infiniteScrollRef={infiniteScrollRef}
          />
          <BackToTop />
        </div>

        <div className={styles.sidebar}>
          <CrateDrawer
            isOpen={isDrawerOpen}
            onReleaseClick={handleReleaseClick}
          />
        </div>
      </div>
      {isMobile && activeCrateId && (
        <button
          type="button"
          className={styles.crateFab}
          onClick={toggleDrawer}
          aria-label={`${isDrawerOpen ? "Close" : "Open"} crate with ${selectedReleases.length} items`}
        >
          <div className={styles.fabContent}>
            <div className={styles.fabMain}>
              <span className={styles.fabMainContent}>
                {crateName ? <span>{crateName}</span> : <span>Crate</span>}
              </span>
              <span className={styles.fabCount}>{selectedReleases.length}</span>
            </div>
          </div>
        </button>
      )}
      <ReleaseModal
        isOpen={selectedReleaseId !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
    </Page>
  );
}
