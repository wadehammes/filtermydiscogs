"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { Page } from "src/components/Page/Page.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import { ReleasesLoading } from "src/components/ReleasesLoading/ReleasesLoading.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { ViewToggle } from "src/components/ViewToggle/ViewToggle.component";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import {
  useFilters,
  useMemoizedFilteredReleases,
} from "src/context/filters.context";
import { useView, ViewActionTypes } from "src/context/view.context";
import { useAuthRedirect } from "src/hooks/useAuthRedirect.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesDisplay } from "src/hooks/useReleasesDisplay.hook";
import Check from "src/styles/icons/check-solid.svg";
import type { DiscogsRelease } from "src/types";
import styles from "./page.module.css";

export default function ReleasesPage() {
  const { authLoading } = useAuthRedirect();
  const { state: authState } = useAuth();
  const { username, isAuthenticated } = authState;
  const { isDrawerOpen, closeDrawer } = useCrate();
  const { state: viewState, dispatch: viewDispatch } = useView();
  const { state: filtersState } = useFilters();
  const { selectedSort } = filtersState;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [highlightedReleaseId, setHighlightedReleaseId] = useState<
    string | null
  >(null);
  const [isSorting, setIsSorting] = useState(false);
  const [previousSort, setPreviousSort] = useState(selectedSort);

  const { isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCollectionData(username, isAuthenticated);

  const { error, hasReleases, hasError } = useReleasesDisplay();
  const filteredReleases = useMemoizedFilteredReleases();
  const releaseCount = filteredReleases.length;

  // Detect when sorting changes and reset loading state
  useEffect(() => {
    if (selectedSort !== previousSort) {
      setIsSorting(true);
      setPreviousSort(selectedSort);
    }
  }, [selectedSort, previousSort]);

  // Reset sorting state when we start getting new data
  useEffect(() => {
    if (isSorting && releaseCount > 0) {
      setIsSorting(false);
    }
  }, [isSorting, releaseCount]);

  // Calculate progress for loading indicator
  const loadingProgress = hasReleases
    ? {
        current: isSorting ? 0 : releaseCount,
      }
    : undefined;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

      // Fetch more releases from API when user scrolls to 80% of the container
      if (scrollPercentage > 0.8 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleReleaseClick = useCallback((instanceId: string) => {
    const element = document.getElementById(`release-${instanceId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setTimeout(() => {
        setHighlightedReleaseId(instanceId);

        setTimeout(() => {
          setHighlightedReleaseId(null);
        }, 3000);
      }, 500);
    }
  }, []);

  const handleViewChange = useCallback(
    (view: "card" | "list") => {
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: view,
      });
    },
    [viewDispatch],
  );

  // Load more when intersection observer triggers
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show loading until all releases are fetched (no more pages to load)
  const isInitialLoading = authLoading || isLoading || hasNextPage;

  if (isInitialLoading) {
    return (
      <Page>
        <StickyHeaderBar allReleasesLoaded={false} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
            width: "100%",
          }}
        >
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
      <StickyHeaderBar allReleasesLoaded={true} />
      <div
        className={`${styles.container} ${isDrawerOpen ? styles.withSidebar : ""}`}
      >
        <div
          ref={mainContentRef}
          className={styles.mainContent}
          onScroll={handleScroll}
        >
          {hasReleases && (
            <div className={styles.releasesHeader}>
              <p>
                Showing {releaseCount} releases
                {isFetchingNextPage && (
                  <span className={styles.loadingIcon}>
                    <span className={styles.spinner} />
                    <span>Loading more...</span>
                  </span>
                )}
                {!(hasNextPage || isFetchingNextPage) && (
                  <span className={styles.loadingIcon}>
                    <Check />
                    <span>All releases loaded</span>
                  </span>
                )}
              </p>
              {!isMobile && (
                <ViewToggle
                  currentView={viewState.currentView}
                  onViewChange={handleViewChange}
                />
              )}
            </div>
          )}

          {hasReleases ? (
            <div
              className={
                viewState.currentView === "card"
                  ? styles.releasesGrid
                  : styles.releasesList
              }
            >
              {filteredReleases.map((release: DiscogsRelease) => (
                <div
                  key={release.instance_id}
                  id={`release-${release.instance_id}`}
                >
                  {viewState.currentView === "card" || isMobile ? (
                    <ReleaseCard
                      release={release}
                      isHighlighted={
                        highlightedReleaseId === release.instance_id
                      }
                    />
                  ) : (
                    <ReleaseListItem
                      release={release}
                      isHighlighted={
                        highlightedReleaseId === release.instance_id
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>No releases found</h2>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          )}

          {/* Intersection observer target for infinite scroll */}
          <div ref={ref} className={styles.loadingTrigger}>
            {isFetchingNextPage && <ReleasesLoading isLoaded={false} />}
          </div>
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
