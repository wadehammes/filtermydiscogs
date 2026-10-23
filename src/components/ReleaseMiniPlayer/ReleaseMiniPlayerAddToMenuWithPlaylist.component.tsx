"use client";

import { useRef } from "react";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import {
  ReleaseMiniPlayerAddToMenuView,
  type ReleaseMiniPlayerAddToMenuViewProps,
} from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuView.component";
import { ReleaseTrackRowMenuPlaylistSubmenu } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuPlaylistSubmenu.component";
import { useReleasePlaylistPickerController } from "src/hooks/useReleasePlaylistPickerController.hook";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { definedProps } from "src/utils/definedProps";

export type ReleaseMiniPlayerAddToMenuWithPlaylistProps =
  ReleaseMiniPlayerAddToMenuViewProps & {
    playlistMetadata: UserTrackMetadataBody;
    trackTitle: string;
  };

export const ReleaseMiniPlayerAddToMenuWithPlaylist = ({
  playlistMetadata,
  trackTitle,
  submenuOpenOnHover,
  ...menuProps
}: ReleaseMiniPlayerAddToMenuWithPlaylistProps) => {
  const closeMenuRef = useRef<() => void>(() => {});
  const { createDialogProps, submenuPanelProps } =
    useReleasePlaylistPickerController({
      metadata: playlistMetadata,
      trackTitle,
      onRequestCloseMenu: () => {
        closeMenuRef.current();
      },
      useOverlayStack: true,
    });

  return (
    <>
      <ReleaseMiniPlayerAddToMenuView
        {...menuProps}
        {...definedProps({ submenuOpenOnHover })}
        registerCloseMenu={(closeMenu) => {
          closeMenuRef.current = closeMenu;
        }}
        playlistSubmenu={
          <ReleaseTrackRowMenuPlaylistSubmenu
            trackTitle={trackTitle}
            submenuPanelProps={submenuPanelProps}
            submenuLabel="Playlists"
            {...definedProps({ openOnHover: submenuOpenOnHover })}
          />
        }
      />
      <CreatePlaylistDialog {...createDialogProps} />
    </>
  );
};
