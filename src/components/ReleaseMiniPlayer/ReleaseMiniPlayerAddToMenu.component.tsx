"use client";

import { ReleaseMiniPlayerAddToMenuView } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuView.component";
import { ReleaseMiniPlayerAddToMenuWithPlaylist } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuWithPlaylist.component";
import { useFeatureFlag } from "src/context/featureFlags.context";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsRelease } from "src/types";

export interface ReleaseMiniPlayerAddToMenuProps {
  release: DiscogsRelease;
  playlistMetadata?: UserTrackMetadataBody;
  trackTitle: string;
  actionClass: (active?: boolean) => string;
  slotClass?: string;
}

export const ReleaseMiniPlayerAddToMenu = ({
  release,
  playlistMetadata,
  trackTitle,
  actionClass,
  slotClass = "",
}: ReleaseMiniPlayerAddToMenuProps) => {
  const playlistsEnabled = useFeatureFlag("playlists");

  if (playlistsEnabled && playlistMetadata) {
    return (
      <ReleaseMiniPlayerAddToMenuWithPlaylist
        release={release}
        playlistMetadata={playlistMetadata}
        trackTitle={trackTitle}
        actionClass={actionClass}
        slotClass={slotClass}
      />
    );
  }

  return (
    <ReleaseMiniPlayerAddToMenuView
      release={release}
      trackTitle={trackTitle}
      actionClass={actionClass}
      slotClass={slotClass}
    />
  );
};
