"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { useAuth } from "src/context/auth.context";
import {
  useAddTrackToPlaylistMutation,
  useCreatePlaylistMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import { PlaylistThinIcon } from "src/styles/icons/PlaylistThinIcon.component";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import { sortByDisplayName } from "src/utils/compareByDisplayName";
import { showPlaylistTrackAddedToast } from "src/utils/playlistToast";
import styles from "./ReleasePlaylistPickerDialog.module.css";

export interface ReleasePlaylistPickerSubmenuPanelProps {
  metadata: UserTrackMetadataBody;
  trackTitle: string;
  useOverlayStack?: boolean;
}

export const ReleasePlaylistPickerSubmenuPanel = ({
  metadata,
  trackTitle,
  useOverlayStack = false,
}: ReleasePlaylistPickerSubmenuPanelProps) => {
  const {
    state: { userId },
  } = useAuth();
  const { data: playlists = [], isLoading } = usePlaylistsQuery({
    userId,
  });
  const addTrackMutation = useAddTrackToPlaylistMutation();
  const createPlaylistMutation = useCreatePlaylistMutation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const sortedPlaylists = useMemo(
    () => sortByDisplayName(playlists, (playlist) => playlist.name),
    [playlists],
  );

  const handlePick = useCallback(
    async (playlistId: string, playlistName: string) => {
      await addTrackMutation.mutateAsync({ playlistId, metadata });
      showPlaylistTrackAddedToast(playlistName);
    },
    [addTrackMutation, metadata],
  );

  const handleCreate = useCallback(
    async ({ name }: CreatePlaylistFormValues) => {
      const created = await createPlaylistMutation.mutateAsync(name.trim());
      await addTrackMutation.mutateAsync({
        playlistId: created.id,
        metadata,
      });
      showPlaylistTrackAddedToast(created.name);
      setShowCreateDialog(false);
    },
    [addTrackMutation, createPlaylistMutation, metadata],
  );

  return (
    <>
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
        {isLoading ? (
          <InlinePopoverMenu.Empty>Loading playlists…</InlinePopoverMenu.Empty>
        ) : sortedPlaylists.length === 0 ? (
          <InlinePopoverMenu.Empty>No playlists yet</InlinePopoverMenu.Empty>
        ) : (
          <InlinePopoverMenu.List>
            <InlinePopoverMenu.ItemGroup>
              {sortedPlaylists.map((playlist) => (
                <Menu.Item
                  key={playlist.id}
                  className={inlinePopoverMenuStyles.item}
                  disabled={addTrackMutation.isPending}
                  onClick={() => {
                    void handlePick(playlist.id, playlist.name);
                  }}
                >
                  <span className={styles.playlistItemLabel}>
                    {playlist.name} ({playlist.trackCount})
                  </span>
                </Menu.Item>
              ))}
            </InlinePopoverMenu.ItemGroup>
          </InlinePopoverMenu.List>
        )}
        <InlinePopoverMenu.Footer className={styles.menuFooter}>
          <Menu.Item
            className={classNames(
              inlinePopoverMenuStyles.item,
              styles.createItem,
            )}
            closeOnClick={false}
            onClick={(event) => {
              event.stopPropagation();
              setShowCreateDialog(true);
            }}
          >
            <span className={styles.createIcon} aria-hidden>
              <PlusIcon />
            </span>
            Create new playlist…
          </Menu.Item>
        </InlinePopoverMenu.Footer>
      </InlinePopoverMenu.Panel>
      <CreatePlaylistDialog
        isOpen={showCreateDialog}
        isSubmitting={
          createPlaylistMutation.isPending || addTrackMutation.isPending
        }
        onClose={() => {
          setShowCreateDialog(false);
        }}
        onCreate={handleCreate}
        title="Create playlist"
        description={`Create a playlist and add “${trackTitle}”.`}
        submitLabel="Create and add"
      />
    </>
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
