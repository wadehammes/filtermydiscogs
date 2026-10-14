"use client";

import { type ReactNode, useCallback } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerBetaBanner } from "src/components/PlaylistDrawerBetaBanner/PlaylistDrawerBetaBanner.component";
import { PlaylistDrawerFooter } from "src/components/PlaylistDrawerFooter/PlaylistDrawerFooter.component";
import { PlaylistDrawerTracks } from "src/components/PlaylistDrawerTracks/PlaylistDrawerTracks.component";
import { PlaylistSelector } from "src/components/PlaylistSelector/PlaylistSelector.component";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { definedProps } from "src/utils/definedProps";
import { resolveActivePlaylistId } from "src/utils/resolveActivePlaylistId";
import styles from "./PlaylistDrawer.module.css";

export interface PlaylistDrawerProps {
  isOpen: boolean;
  onReleaseClick?: (instanceId: string) => void;
  aboveMiniPlayer?: boolean;
  activePlaylistId: string | null;
  onActivePlaylistIdChange: (playlistId: string | null) => void;
  lastPlayedPlaylistId?: string | null;
  onAfterPlaylistCreate?: (playlistId: string) => void;
  onSubmitBugReport?: () => void;
}

interface PlaylistDrawerMobileProps {
  isOpen: boolean;
  aboveMiniPlayer: boolean;
  playlistSelector: ReactNode;
  onClose: () => void;
  onSubmitBugReport?: () => void;
}

const PlaylistDrawerMobile = ({
  isOpen,
  aboveMiniPlayer,
  playlistSelector,
  onClose,
  onSubmitBugReport,
}: PlaylistDrawerMobileProps) => (
  <BottomDrawer
    isOpen={isOpen}
    onClose={onClose}
    chrome
    closeButtonPlacement="floating"
    closeButtonAriaLabel="Close playlist drawer"
    contentClassName={styles.mobileDrawerContentFlushTop}
    dataAttribute="data-collection-side-panel-open"
    headerContent={
      <div className={styles.mobileDrawerHeaderStack}>
        <PlaylistDrawerBetaBanner {...definedProps({ onSubmitBugReport })} />
        {playlistSelector}
      </div>
    }
    footer={<PlaylistDrawerFooter />}
    aboveMiniPlayer={aboveMiniPlayer}
  >
    <div className={styles.mobileContent}>
      <PlaylistDrawerTracks />
    </div>
  </BottomDrawer>
);

interface PlaylistDrawerDesktopProps {
  playlistSelector: ReactNode;
  onSubmitBugReport?: () => void;
}

const PlaylistDrawerDesktop = ({
  playlistSelector,
  onSubmitBugReport,
}: PlaylistDrawerDesktopProps) => (
  <div
    className={styles.drawer}
    data-playlist-drawer-desktop
    data-testid="fmdPlaylistDrawer"
  >
    <OverlayStack
      className={styles.overlayStack}
      escapeStackingContext
      popoverZIndex="calc(var(--z-9-playback-dock) + 1)"
    >
      <PlaylistDrawerBetaBanner {...definedProps({ onSubmitBugReport })} />
      <div className={styles.header}>{playlistSelector}</div>
      <div className={styles.content}>
        <PlaylistDrawerTracks />
      </div>
    </OverlayStack>
    <PlaylistDrawerFooter />
  </div>
);

export const PlaylistDrawer = ({
  isOpen,
  onReleaseClick,
  aboveMiniPlayer = false,
  activePlaylistId,
  onActivePlaylistIdChange,
  lastPlayedPlaylistId = null,
  onAfterPlaylistCreate,
  onSubmitBugReport,
}: PlaylistDrawerProps) => {
  const { toggleDrawer } = useCrate();
  const isMobile = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const {
    state: { userId },
  } = useAuth();
  const { data: playlists = [] } = usePlaylistsQuery({
    userId,
    enabled: isOpen,
  });
  const effectivePlaylistId = resolveActivePlaylistId({
    playlists,
    activePlaylistId,
    lastPlayedPlaylistId,
  });

  const selectPlaylist = useCallback(
    (playlistId: string | null) => {
      onActivePlaylistIdChange(playlistId);
    },
    [onActivePlaylistIdChange],
  );

  const playlistSelector = (
    <PlaylistSelector
      activePlaylistId={effectivePlaylistId}
      onPlaylistChange={selectPlaylist}
      className={styles.headerPlaylistSelector}
      enabled={isOpen}
      {...definedProps({
        onAfterPlaylistCreate: onAfterPlaylistCreate,
      })}
    />
  );

  return (
    <PlaylistDrawerProvider
      activePlaylistId={effectivePlaylistId}
      selectPlaylist={selectPlaylist}
      {...definedProps({ onReleaseClick })}
    >
      {isMobile ? (
        <PlaylistDrawerMobile
          isOpen={isOpen}
          aboveMiniPlayer={aboveMiniPlayer}
          playlistSelector={playlistSelector}
          onClose={toggleDrawer}
          {...definedProps({ onSubmitBugReport })}
        />
      ) : (
        <PlaylistDrawerDesktop
          playlistSelector={playlistSelector}
          {...definedProps({ onSubmitBugReport })}
        />
      )}
    </PlaylistDrawerProvider>
  );
};
