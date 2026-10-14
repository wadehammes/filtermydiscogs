"use client";

import classNames from "classnames";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { BackToTop } from "src/components/BackToTop/BackToTop.component";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { PlaylistDrawer } from "src/components/PlaylistDrawer/PlaylistDrawer.component";
import { ReleaseModalLazyOverlay } from "src/components/ReleaseModal/ReleaseModalLazyOverlay.component";
import { RELEASES_WORKSPACE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useFeatureFlag } from "src/context/featureFlags.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import type { CollectionSidePanelMode } from "src/hooks/useCrateDrawer.hook";
import { useOfferPendingFiltersRestore } from "src/hooks/useOfferPendingFiltersRestore.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import type { PlaylistSummary } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import { readLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import { resolveActivePlaylistId } from "src/utils/resolveActivePlaylistId";
import { LoadingTrigger } from "./LoadingTrigger.component";
import styles from "./ReleasesClient.module.css";
import { ReleasesGrid } from "./ReleasesGrid.component";
import { ReleasesHeader } from "./ReleasesHeader.component";
import { ReleasesPageLoading } from "./ReleasesPageLoading.component";
import { ReleasesSkeleton } from "./ReleasesSkeleton.component";

const EMPTY_PLAYLIST_SUMMARIES: PlaylistSummary[] = [];

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
  const playlistsEnabled = useFeatureFlag("playlists");
  const { data: playlistsData } = usePlaylistsQuery({
    userId,
    enabled: playlistsEnabled,
  });
  const playlists = playlistsData ?? EMPTY_PLAYLIST_SUMMARIES;
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name;
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const hydratedPlaylistUserRef = useRef<string | null>(null);
  const lastPlayedPlaylistId = userId ? readLastPlayedPlaylistId(userId) : null;

  useEffect(() => {
    if (!playlistsEnabled) {
      setActivePlaylistId(null);
      return;
    }

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
  }, [playlists, playlistsEnabled, userId]);

  useEffect(() => {
    if (!playlistsEnabled && sidePanel === "playlists") {
      selectSidePanel("crates");
    }
  }, [playlistsEnabled, selectSidePanel, sidePanel]);

  const handleSelectSidePanel = useCallback(
    (panel: CollectionSidePanelMode) => {
      if (panel === "playlists" && !playlistsEnabled) {
        return;
      }

      selectSidePanel(panel);
    },
    [playlistsEnabled, selectSidePanel],
  );

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
    infiniteScrollRef,
    isFilterPending,
    selectedRelease,
    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  } = useReleasesClient({ scrollElement: scrollRoot });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const allReleasesLoaded = !(isLoading || hasNextPage || isFetchingNextPage);
  useOfferPendingFiltersRestore(allReleasesLoaded);

  if (shouldRedirectHome) {
    return null;
  }

  if (isCheckingAuth) {
    return <ReleasesPageLoading />;
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
            {isMobile &&
            (sidePanel === "crates"
              ? activeCrateId
              : playlistsEnabled &&
                (activePlaylistId || playlists.length > 0)) ? (
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
            [styles.withSidebar]: isDrawerOpen,
          })}
          data-releases-workspace
        >
          <div className={styles.workspaceRow}>
            <main
              ref={setMainContentNode}
              className={styles.mainContent}
              data-releases-scroll-root
              aria-label={RELEASES_WORKSPACE_MAIN_LABEL}
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
                  onSelectSidePanel={handleSelectSidePanel}
                  playlistsEnabled={playlistsEnabled}
                  deferSidePanelHighlight={isSidePanelDefaultPending}
                />
              ) : null}

              {hasReleases ? (
                <div
                  key={currentView}
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
                <EmptyState
                  title="No releases found"
                  description="Try adjusting your filters to see more results."
                />
              )}

              <LoadingTrigger
                isFetchingNextPage={isFetchingNextPage}
                infiniteScrollRef={infiniteScrollRef}
              />
            </main>

            <div className={styles.sidebar}>
              <Activity mode={isDrawerOpen ? "visible" : "hidden"}>
                {isSidePanelDefaultPending ? null : sidePanel === "crates" ||
                  !playlistsEnabled ? (
                  <CrateDrawer
                    isOpen={isDrawerOpen}
                    onReleaseClick={handleReleaseClick}
                    aboveMiniPlayer={isMiniPlayerVisible}
                  />
                ) : (
                  <PlaylistDrawer
                    isOpen={isDrawerOpen}
                    onReleaseClick={handleReleaseClick}
                    aboveMiniPlayer={isMiniPlayerVisible}
                    activePlaylistId={activePlaylistId}
                    onActivePlaylistIdChange={handleActivePlaylistIdChange}
                    lastPlayedPlaylistId={lastPlayedPlaylistId}
                    onAfterPlaylistCreate={handleAfterPlaylistCreate}
                  />
                )}
              </Activity>
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
