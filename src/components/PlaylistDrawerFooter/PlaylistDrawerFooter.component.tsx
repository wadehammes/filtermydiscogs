"use client";

import classNames from "classnames";
import { useCallback, useState } from "react";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import { useAuth } from "src/context/auth.context";
import { useDeletePlaylistMutation } from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistQuery } from "src/hooks/queries/usePlaylistsQuery";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import PlayIcon from "src/styles/icons/play-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { writeLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import styles from "./PlaylistDrawerFooter.module.css";

export const PlaylistDrawerFooter = () => {
  const {
    state: { userId },
  } = useAuth();
  const { activePlaylistId, selectPlaylist } = usePlaylistDrawerContext();
  const { data: playlist } = usePlaylistQuery({
    userId,
    playlistId: activePlaylistId,
    enabled: Boolean(activePlaylistId),
  });
  const { addPlaylistToQueue, playPlaylistTracks } = usePlaylistPlayback();
  const deletePlaylistMutation = useDeletePlaylistMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const trackCount = playlist?.tracks.length ?? 0;

  const handleConfirmDelete = useCallback(async () => {
    if (!activePlaylistId) {
      return;
    }

    await deletePlaylistMutation.mutateAsync(activePlaylistId);
    setShowDeleteDialog(false);
    selectPlaylist(null);
  }, [activePlaylistId, deletePlaylistMutation, selectPlaylist]);

  return (
    <>
      <div className={styles.footer} data-testid="fmdPlaylistDrawerFooter">
        <SegmentedControl
          legend="Playlist drawer actions"
          className={styles.footerSegmented}
        >
          {activePlaylistId ? (
            <IconButton
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
                styles.deleteSegment,
              )}
              iconClassName={styles.footerSegmentIcon}
              label="Delete"
              disabled={deletePlaylistMutation.isPending}
              onClick={() => {
                setShowDeleteDialog(true);
              }}
            >
              <TrashOpenIcon />
            </IconButton>
          ) : (
            <span
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
              aria-disabled="true"
            >
              <span className={styles.footerSegmentIcon} aria-hidden>
                <TrashOpenIcon />
              </span>
              <span>Delete</span>
            </span>
          )}
          <IconButton
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
            )}
            iconClassName={styles.footerSegmentIcon}
            label="Add to queue"
            disabled={!playlist || trackCount === 0}
            onClick={() => {
              if (playlist) {
                addPlaylistToQueue(playlist.tracks);
              }
            }}
            data-testid="fmdPlaylistDrawerAddToQueueButton"
          >
            <ListPlusThinIcon />
          </IconButton>
          <IconButton
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
              styles.playSegment,
            )}
            iconClassName={styles.footerSegmentIcon}
            label="Play"
            disabled={!playlist || trackCount === 0}
            onClick={() => {
              if (!playlist) {
                return;
              }

              if (userId && activePlaylistId) {
                writeLastPlayedPlaylistId(userId, activePlaylistId);
              }

              playPlaylistTracks(playlist.tracks);
            }}
          >
            <PlayIcon />
          </IconButton>
        </SegmentedControl>
        <PlaylistShareControls />
      </div>
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete playlist?"
        message={
          playlist
            ? `“${playlist.name}” and its tracks will be removed. This cannot be undone.`
            : "This playlist will be removed. This cannot be undone."
        }
        variant="danger"
        confirmLabel="Delete"
        isConfirming={deletePlaylistMutation.isPending}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
        }}
      />
    </>
  );
};
