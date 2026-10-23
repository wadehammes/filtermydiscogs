"use client";

import { ReleaseMiniPlayerAddToMenuView } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuView.component";
import { ReleaseMiniPlayerAddToMenuWithPlaylist } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuWithPlaylist.component";
import { useFeatureFlag } from "src/context/featureFlags.context";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";

export interface ReleaseMiniPlayerAddToMenuProps {
  release: DiscogsRelease;
  playlistMetadata?: UserTrackMetadataBody;
  trackTitle: string;
  actionClass: (active?: boolean) => string;
  slotClass?: string;
  submenuOpenOnHover?: boolean;
}

export const ReleaseMiniPlayerAddToMenu = ({
  release,
  playlistMetadata,
  trackTitle,
  actionClass,
  slotClass = "",
  submenuOpenOnHover,
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
        {...definedProps({ submenuOpenOnHover })}
      />
    );
  }

  return (
    <ReleaseMiniPlayerAddToMenuView
      release={release}
      actionClass={actionClass}
      slotClass={slotClass}
      {...definedProps({ submenuOpenOnHover })}
    />
  );
};
