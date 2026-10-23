"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import { PlaylistThinIcon } from "src/styles/icons/PlaylistThinIcon.component";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import type { PlaylistSummary } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleasePlaylistPickerDialog.module.css";

export interface ReleasePlaylistPickerSubmenuPanelProps {
  useOverlayStack?: boolean;
  isLoading: boolean;
  sortedPlaylists: PlaylistSummary[];
  isAddTrackPending: boolean;
  onPickPlaylist: (
    playlistId: string,
    playlistName: string,
    containsTrack: boolean,
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
          {sortedPlaylists.map((playlist) => {
            const containsTrack = playlist.containsTrack === true;
            const playlistLabel = `${playlist.name} (${playlist.trackCount})`;

            return (
              <Menu.Item
                key={playlist.id}
                className={classNames(inlinePopoverMenuStyles.item, {
                  [styles.playlistItemWithMembership]: true,
                  [styles.playlistItemContainsTrack]: containsTrack,
                })}
                disabled={isAddTrackPending}
                aria-label={
                  containsTrack
                    ? `${playlistLabel}, already in playlist`
                    : playlistLabel
                }
                onClick={() => {
                  onPickPlaylist(playlist.id, playlist.name, containsTrack);
                }}
              >
                <span className={styles.membershipIndicator} aria-hidden>
                  {containsTrack ? (
                    <>
                      <CheckThinIcon
                        className={styles.membershipCheckIcon}
                        strokeWidth={1.75}
                        data-testid="fmdPlaylistPickerMembershipCheck"
                      />
                      <MinusIcon className={styles.membershipRemoveIcon} />
                    </>
                  ) : null}
                </span>
                <span className={styles.playlistItemLabel}>
                  {playlistLabel}
                </span>
              </Menu.Item>
            );
          })}
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
  openOnHover,
}: ReleasePlaylistPickerSubmenuTriggerProps) => (
  <Menu.SubmenuTrigger
    className={classNames(inlinePopoverMenuStyles.item, styles.submenuTrigger)}
    aria-label={`Add ${trackTitle} to playlist`}
    {...definedProps({ openOnHover })}
  >
    <span className={styles.submenuTriggerIcon} aria-hidden>
      <PlaylistThinIcon />
    </span>
    <span className={styles.submenuLabel}>{submenuLabel}</span>
    <ChevronRightThinIcon className={styles.submenuChevron} aria-hidden />
  </Menu.SubmenuTrigger>
);
