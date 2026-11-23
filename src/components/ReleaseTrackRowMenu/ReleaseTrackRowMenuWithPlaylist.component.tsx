"use client";

import { useRef } from "react";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import { ReleaseTrackRowMenuPlaylistSubmenu } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuPlaylistSubmenu.component";
import {
  ReleaseTrackRowMenuView,
  type ReleaseTrackRowMenuViewProps,
} from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuView.component";
import { useReleasePlaylistPickerController } from "src/hooks/useReleasePlaylistPickerController.hook";
import type { AddPlaylistTrackBody } from "src/lib/validation/playlist.schemas";
import { definedProps } from "src/utils/definedProps";

export type ReleaseTrackRowMenuWithPlaylistProps =
  ReleaseTrackRowMenuViewProps & {
    playlistPickerMetadata: AddPlaylistTrackBody;
  };

export const ReleaseTrackRowMenuWithPlaylist = ({
  playlistPickerMetadata,
  trackTitle,
  useMenuOverlayStack = true,
  playlistSubmenuOpenOnHover,
  ...menuProps
}: ReleaseTrackRowMenuWithPlaylistProps) => {
  const closeMenuRef = useRef<() => void>(() => {});
  const { createDialogProps, submenuPanelProps } =
    useReleasePlaylistPickerController({
      metadata: playlistPickerMetadata,
      trackTitle,
      onRequestCloseMenu: () => {
        closeMenuRef.current();
      },
      useOverlayStack: useMenuOverlayStack,
    });

  return (
    <>
      <ReleaseTrackRowMenuView
        {...menuProps}
        trackTitle={trackTitle}
        useMenuOverlayStack={useMenuOverlayStack}
        registerCloseMenu={(closeMenu) => {
          closeMenuRef.current = closeMenu;
        }}
        playlistSubmenu={
          <ReleaseTrackRowMenuPlaylistSubmenu
            trackTitle={trackTitle}
            submenuPanelProps={submenuPanelProps}
            {...definedProps({ openOnHover: playlistSubmenuOpenOnHover })}
          />
        }
      />
      <CreatePlaylistDialog {...createDialogProps} />
    </>
  );
};
