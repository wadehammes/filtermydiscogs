"use client";

import { Activity } from "react";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import { PlaylistDrawer } from "src/components/PlaylistDrawer/PlaylistDrawer.component";
import { CollectionSidePanelPlaceholder } from "src/components/ReleasesClient/CollectionSidePanelPlaceholder.component";
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
}: Pick<ReleasesCollectionSidePanelProps, "isDrawerOpen" | "isClient">) =>
  isDrawerOpen && isClient;

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

  if (isSidePanelDefaultPending) {
    return (
      <Activity mode={isDrawerOpen ? "visible" : "hidden"}>
        <CollectionSidePanelPlaceholder />
      </Activity>
    );
  }

  let drawer = null;

  if (sidePanel === "crates") {
    drawer = (
      <CrateDrawer
        isOpen={isDrawerOpen}
        onReleaseClick={onReleaseClick}
        aboveMiniPlayer={aboveMiniPlayer}
      />
    );
  } else {
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
