"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import { PlaylistThinIcon } from "src/styles/icons/PlaylistThinIcon.component";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import type { PlaylistSummary } from "src/types/playlist.types";
import styles from "./ReleasePlaylistPickerDialog.module.css";

export interface ReleasePlaylistPickerSubmenuPanelProps {
  useOverlayStack?: boolean;
  isLoading: boolean;
  sortedPlaylists: PlaylistSummary[];
  isAddTrackPending: boolean;
  onPickPlaylist: (
    playlistId: string,
    playlistName: string,
  ) => void | Promise<void>;
  onOpenCreateDialog: () => void;
}

export const ReleasePlaylistPickerSubmenuPanel = ({
  useOverlayStack = false,
  isLoading,
  sortedPlaylists,
  isAddTrackPending,
  onPickPlaylist,
  onOpenCreateDialog,
}: ReleasePlaylistPickerSubmenuPanelProps) => {
  let playlistListContent = null;

  if (isLoading) {
    playlistListContent = (
      <InlinePopoverMenu.Empty>Loading playlists…</InlinePopoverMenu.Empty>
    );
  } else if (sortedPlaylists.length === 0) {
    playlistListContent = (
      <InlinePopoverMenu.Empty>No playlists yet</InlinePopoverMenu.Empty>
    );
  } else {
    playlistListContent = (
      <InlinePopoverMenu.List>
        <InlinePopoverMenu.ItemGroup>
          {sortedPlaylists.map((playlist) => (
            <Menu.Item
              key={playlist.id}
              className={inlinePopoverMenuStyles.item}
              disabled={isAddTrackPending}
              onClick={() => {
                onPickPlaylist(playlist.id, playlist.name);
              }}
            >
              <span className={styles.playlistItemLabel}>
                {playlist.name} ({playlist.trackCount})
              </span>
            </Menu.Item>
          ))}
        </InlinePopoverMenu.ItemGroup>
      </InlinePopoverMenu.List>
    );
  }

  return (
    <InlinePopoverMenu.Panel
      variant="submenu"
      scrollable
      popupClassName={styles.submenuPopup}
      testId="fmdReleasePlaylistPickerMenu"
      useOverlayStack={useOverlayStack}
    >
      <InlinePopoverMenu.Heading className={styles.menuHeading}>
        Add to playlist
      </InlinePopoverMenu.Heading>
      {playlistListContent}
      <InlinePopoverMenu.Footer className={styles.menuFooter}>
        <Menu.Item
          className={classNames(
            inlinePopoverMenuStyles.item,
            styles.createItem,
          )}
          closeOnClick={false}
          onClick={(event) => {
            event.stopPropagation();
            onOpenCreateDialog();
          }}
        >
          <span className={styles.createIcon} aria-hidden>
            <PlusIcon />
          </span>
          Create new playlist…
        </Menu.Item>
      </InlinePopoverMenu.Footer>
    </InlinePopoverMenu.Panel>
  );
};

export interface ReleasePlaylistPickerSubmenuTriggerProps {
  trackTitle: string;
  submenuLabel?: string;
  openOnHover?: boolean;
}

export const ReleasePlaylistPickerSubmenuTrigger = ({
  trackTitle,
  submenuLabel = "Add to playlist",
  openOnHover = true,
}: ReleasePlaylistPickerSubmenuTriggerProps) => (
  <Menu.SubmenuTrigger
    className={classNames(inlinePopoverMenuStyles.item, styles.submenuTrigger)}
    aria-label={`Add ${trackTitle} to playlist`}
    openOnHover={openOnHover}
  >
    <span className={styles.submenuTriggerIcon} aria-hidden>
      <PlaylistThinIcon />
    </span>
    <span className={styles.submenuLabel}>{submenuLabel}</span>
    <ChevronRightThinIcon className={styles.submenuChevron} aria-hidden />
  </Menu.SubmenuTrigger>
);
