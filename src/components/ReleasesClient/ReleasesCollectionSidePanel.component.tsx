"use client";

import { Activity } from "react";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { PlaylistDrawer } from "src/components/PlaylistDrawer/PlaylistDrawer.component";
import type { CollectionSidePanelMode } from "src/hooks/useCrateDrawer.hook";

interface ReleasesCollectionSidePanelProps {
  isClient: boolean;
  isDrawerOpen: boolean;
  isSidePanelDefaultPending: boolean;
  sidePanel: CollectionSidePanelMode;
  onReleaseClick: (instanceId: string) => void;
  aboveMiniPlayer: boolean;
  activePlaylistId: string | null;
  onActivePlaylistIdChange: (playlistId: string | null) => void;
  lastPlayedPlaylistId: string | null;
  onAfterPlaylistCreate: (playlistId: string) => void;
}

export const showCollectionSideColumn = ({
  isDrawerOpen,
  isClient,
  isSidePanelDefaultPending,
}: Pick<
  ReleasesCollectionSidePanelProps,
  "isDrawerOpen" | "isClient" | "isSidePanelDefaultPending"
>) => isDrawerOpen && isClient && !isSidePanelDefaultPending;

export const ReleasesCollectionSidePanel = ({
  isClient,
  isDrawerOpen,
  isSidePanelDefaultPending,
  sidePanel,
  onReleaseClick,
  aboveMiniPlayer,
  activePlaylistId,
  onActivePlaylistIdChange,
  lastPlayedPlaylistId,
  onAfterPlaylistCreate,
}: ReleasesCollectionSidePanelProps) => {
  if (!isClient) {
    return null;
  }

  let drawer = null;

  if (!isSidePanelDefaultPending && sidePanel === "crates") {
    drawer = (
      <CrateDrawer
        isOpen={isDrawerOpen}
        onReleaseClick={onReleaseClick}
        aboveMiniPlayer={aboveMiniPlayer}
      />
    );
  } else if (!isSidePanelDefaultPending) {
    drawer = (
      <PlaylistDrawer
        isOpen={isDrawerOpen}
        onReleaseClick={onReleaseClick}
        aboveMiniPlayer={aboveMiniPlayer}
        activePlaylistId={activePlaylistId}
        onActivePlaylistIdChange={onActivePlaylistIdChange}
        lastPlayedPlaylistId={lastPlayedPlaylistId}
        onAfterPlaylistCreate={onAfterPlaylistCreate}
      />
    );
  }

  return (
    <Activity mode={isDrawerOpen ? "visible" : "hidden"}>{drawer}</Activity>
  );
};
