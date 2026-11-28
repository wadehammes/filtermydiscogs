"use client";

import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CollectionCommandPalette } from "src/components/CollectionCommandPalette/CollectionCommandPalette.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { ReleaseModalLazyOverlay } from "src/components/ReleaseModal/ReleaseModalLazyOverlay.component";
import { RELEASES_WORKSPACE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import { useIsClient } from "src/hooks/useIsClient.hook";
import { useOfferPendingFiltersRestore } from "src/hooks/useOfferPendingFiltersRestore.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { useReleasesLoadingViewMode } from "src/hooks/useReleasesLoadingViewMode.hook";
import type { PlaylistSummary } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import { readLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import { resolveReleasesEmptyState } from "src/utils/releasesEmptyState";
import { resolveActivePlaylistId } from "src/utils/resolveActivePlaylistId";
import { CollectionLoadErrorPanel } from "./CollectionLoadErrorPanel.component";
import { LoadingTrigger } from "./LoadingTrigger.component";
import styles from "./ReleasesClient.module.css";
import {
  ReleasesCollectionSidePanel,
  showCollectionSideColumn,
} from "./ReleasesCollectionSidePanel.component";
import { ReleasesGrid } from "./ReleasesGrid.component";
import { ReleasesHeader } from "./ReleasesHeader.component";
import { ReleasesPageLoading } from "./ReleasesPageLoading.component";
import { ReleasesSkeleton } from "./ReleasesSkeleton.component";

const EMPTY_PLAYLIST_SUMMARIES: PlaylistSummary[] = [];

const showCollectionLoadError = ({
  hasError,
  isFetchingNextPage,
  isLoading,
}: {
  hasError: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
}) => hasError && !isLoading && !isFetchingNextPage;

const ReleasesClientContent = () => {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const {
    isDrawerOpen,
    toggleDrawer,
    sidePanel,
    isSidePanelDefaultPending,
    selectSidePanel,
    openPlaylistsDrawer,
    selectedReleases,
    crates,
    activeCrateId,
  } = useCrate();
  const {
    state: { userId },
  } = useAuth();
  const { data: playlistsData } = usePlaylistsQuery({
    userId,
    enabled: Boolean(userId),
  });
  const playlists = playlistsData ?? EMPTY_PLAYLIST_SUMMARIES;
  const isClient = useIsClient();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const showSidePanel = showCollectionSideColumn({
    isDrawerOpen,
    isClient,
  });
  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name;
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const hydratedPlaylistUserRef = useRef<string | null>(null);
  const lastPlayedPlaylistId = userId ? readLastPlayedPlaylistId(userId) : null;

  useEffect(() => {
    if (!userId) {
      hydratedPlaylistUserRef.current = null;
      setActivePlaylistId(null);
      return;
    }

    if (playlists.length === 0) {
      return;
    }

    if (hydratedPlaylistUserRef.current !== userId) {
      hydratedPlaylistUserRef.current = userId;
      setActivePlaylistId(
        resolveActivePlaylistId({
          playlists,
          activePlaylistId: null,
          lastPlayedPlaylistId: readLastPlayedPlaylistId(userId),
        }),
      );
      return;
    }

    setActivePlaylistId((current) => {
      if (current && playlists.some((playlist) => playlist.id === current)) {
        return current;
      }

      return resolveActivePlaylistId({
        playlists,
        activePlaylistId: current,
        lastPlayedPlaylistId: readLastPlayedPlaylistId(userId),
      });
    });
  }, [playlists, userId]);

  const handleActivePlaylistIdChange = useCallback(
    (playlistId: string | null) => {
      setActivePlaylistId(playlistId);
    },
    [],
  );

  const handleAfterPlaylistCreate = useCallback(
    (playlistId: string) => {
      setActivePlaylistId(playlistId);
      openPlaylistsDrawer();
    },
    [openPlaylistsDrawer],
  );

  const activePlaylist = playlists.find(
    (playlist) => playlist.id === activePlaylistId,
  );
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const setMainContentNode = useCallback((node: HTMLElement | null) => {
    setScrollRoot(node);
  }, []);

  const loadingView = useReleasesLoadingViewMode();

  const {
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    hasError,
    error,
    queryError,
    hasReleases,
    showAllLoadedMessage,
    visibleReleases,
    releaseCount,
    isRandomMode,
    randomRelease,
    isMobile,
    currentView,
    infiniteScrollRef,
    visibleCountResetKey,
    isFilterPending,
    selectedRelease,
    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient({ scrollElement: scrollRoot });
  const allReleases = useAllReleases();
  const { hasActiveFilters } = useFilterViews();
  const releasesEmptyState = resolveReleasesEmptyState({
    allReleaseCount: allReleases.length,
    hasActiveFilters,
    isRandomMode,
  });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const allReleasesLoaded = !(isLoading || hasNextPage || isFetchingNextPage);
  useOfferPendingFiltersRestore(allReleasesLoaded);

  if (shouldRedirectHome) {
    return null;
  }

  if (isCheckingAuth) {
    return <ReleasesPageLoading />;
  }

  if (
    showCollectionLoadError({
      hasError,
      isFetchingNextPage,
      isLoading,
    })
  ) {
    return (
      <Page>
        <CollectionPlaybackPageShell
          allReleasesLoaded={false}
          currentPage="releases"
        >
          <CollectionLoadErrorPanel error={queryError ?? error} />
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
            {isMobile &&
            (sidePanel === "crates"
              ? activeCrateId
              : activePlaylistId || playlists.length > 0) ? (
              <button
                type="button"
                className={styles.crateFab}
                data-testid="fmdReleaseSidePanelFab"
                onClick={toggleDrawer}
                aria-label={
                  sidePanel === "crates"
                    ? `${isDrawerOpen ? "Close" : "Open"} crate with ${selectedReleases.length} items`
                    : `${isDrawerOpen ? "Close" : "Open"} playlist with ${activePlaylist?.trackCount ?? 0} tracks`
                }
              >
                <div className={styles.fabContent}>
                  <div className={styles.fabMain}>
                    <span className={styles.fabMainContent}>
                      {sidePanel === "crates" ? (
                        crateName ? (
                          <span>{crateName}</span>
                        ) : (
                          <span>Crate</span>
                        )
                      ) : activePlaylist ? (
                        <span>{activePlaylist.name}</span>
                      ) : (
                        <span>Playlist</span>
                      )}
                    </span>
                    <span className={styles.fabCount}>
                      {sidePanel === "crates"
                        ? selectedReleases.length
                        : (activePlaylist?.trackCount ?? 0)}
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
            [styles.withSidebar]: showSidePanel,
          })}
          data-releases-workspace
        >
          <div className={styles.workspaceRow}>
            <main
              ref={setMainContentNode}
              className={styles.mainContent}
              data-releases-scroll-root
              aria-label={RELEASES_WORKSPACE_MAIN_LABEL}
              tabIndex={-1}
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
                  sidePanel={sidePanel}
                  isSidePanelOpen={isDrawerOpen}
                  onSelectSidePanel={selectSidePanel}
                  deferSidePanelHighlight={isSidePanelDefaultPending}
                />
              ) : null}

              {hasReleases ? (
                <div
                  key={`${currentView}-${visibleCountResetKey}`}
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
                    gridRemountKey={visibleCountResetKey}
                  />
                </div>
              ) : !allReleasesLoaded ? (
                <ReleasesSkeleton isMobile={isMobile} view={loadingView} />
              ) : (
                <EmptyState
                  variant="page"
                  title={releasesEmptyState.title}
                  description={releasesEmptyState.description}
                />
              )}

              <LoadingTrigger
                isFetchingNextPage={isFetchingNextPage}
                infiniteScrollRef={infiniteScrollRef}
              />
            </main>

            <div className={styles.sidebar}>
              <ReleasesCollectionSidePanel
                isClient={isClient}
                isDrawerOpen={isDrawerOpen}
                isSidePanelDefaultPending={isSidePanelDefaultPending}
                sidePanel={sidePanel}
                onReleaseClick={handleReleaseClick}
                aboveMiniPlayer={isMiniPlayerVisible}
                activePlaylistId={activePlaylistId}
                onActivePlaylistIdChange={handleActivePlaylistIdChange}
                lastPlayedPlaylistId={lastPlayedPlaylistId}
                onAfterPlaylistCreate={handleAfterPlaylistCreate}
              />
            </div>
          </div>
        </div>
      </CollectionPlaybackPageShell>
      <CollectionCommandPalette />
    </Page>
  );
};

export default function ReleasesClient() {
  return <ReleasesClientContent />;
}
