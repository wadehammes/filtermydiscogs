"use client";

import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerFooterActionsMenu } from "src/components/PlaylistDrawerFooterActionsMenu/PlaylistDrawerFooterActionsMenu.component";
import { PlaylistDrawerStats } from "src/components/PlaylistDrawerStats/PlaylistDrawerStats.component";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useAuth } from "src/context/auth.context";
import {
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { useActivePlaylistDetail } from "src/hooks/useActivePlaylistDetail.hook";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import PlayIcon from "src/styles/icons/play-thin.svg";
import TableIcon from "src/styles/icons/table-thin.svg";
import { writeLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import { listPlaylistDrawerStatEntriesFromDetail } from "src/utils/playlistDrawerStats";
import { normalizePlaylistPublicDescriptionForStorage } from "src/utils/publicPlaylistDescription";
import styles from "./PlaylistDrawerFooter.module.css";

export const PlaylistDrawerFooter = () => {
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const {
    state: { userId },
  } = useAuth();
  const {
    activePlaylistId,
    selectPlaylist,
    statsPanelOpen,
    setStatsPanelOpen,
  } = usePlaylistDrawerContext();
  const { data: playlist } = useActivePlaylistDetail();
  const { addPlaylistToQueue, playPlaylistTracks } = usePlaylistPlayback();
  const deletePlaylistMutation = useDeletePlaylistMutation();
  const updatePlaylistMutation = useUpdatePlaylistMutation();
  const desktopEditMenu = useInlinePopoverMenuClose();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const trackCount = playlist?.tracks.length ?? 0;
  const drawerStatEntries = useMemo(
    () => (playlist ? listPlaylistDrawerStatEntriesFromDetail(playlist) : []),
    [playlist],
  );
  const hasDrawerStats = drawerStatEntries.length > 0;
  const isBusy =
    deletePlaylistMutation.isPending || updatePlaylistMutation.isPending;

  const handleConfirmDelete = useCallback(async () => {
    if (!activePlaylistId) {
      return;
    }

    await deletePlaylistMutation.mutateAsync(activePlaylistId);
    setShowDeleteDialog(false);
    selectPlaylist(null);
  }, [activePlaylistId, deletePlaylistMutation, selectPlaylist]);

  const handleRename = useCallback(
    async ({ name, publicDescription }: CreatePlaylistFormValues) => {
      if (!activePlaylistId) {
        return;
      }

      const trimmedName = name.trim();
      const nextDescription =
        normalizePlaylistPublicDescriptionForStorage(publicDescription);
      const currentDescription = playlist?.publicDescription ?? null;

      if (!trimmedName) {
        setShowRenameDialog(false);
        return;
      }

      const nameUnchanged = trimmedName === playlist?.name.trim();
      const descriptionUnchanged = nextDescription === currentDescription;

      if (nameUnchanged && descriptionUnchanged) {
        setShowRenameDialog(false);
        return;
      }

      await updatePlaylistMutation.mutateAsync({
        playlistId: activePlaylistId,
        payload: {
          ...(nameUnchanged ? {} : { name: trimmedName }),
          ...(descriptionUnchanged
            ? {}
            : { publicDescription: nextDescription }),
        },
      });
      setShowRenameDialog(false);
    },
    [
      activePlaylistId,
      playlist?.name,
      playlist?.publicDescription,
      updatePlaylistMutation,
    ],
  );

  const playButton = (
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
  );

  const queueButton = (
    <IconButton
      className={classNames(segmentedStyles.segment, styles.footerSegment)}
      iconClassName={styles.footerSegmentIcon}
      label="Queue"
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
  );

  return (
    <>
      <div className={styles.footer} data-testid="fmdPlaylistDrawerFooter">
        <div className={styles.footerActions}>
          <PlaylistDrawerStats entries={drawerStatEntries} />
          <SegmentedControl
            legend="Playlist drawer actions"
            allowOverflow
            className={styles.footerSegmented}
          >
            {isBelowDesktop ? (
              <>
                {queueButton}
                {playButton}
                <PlaylistDrawerFooterActionsMenu
                  hasDrawerStats={hasDrawerStats}
                  isBusy={isBusy}
                  onRename={() => {
                    setShowRenameDialog(true);
                  }}
                  onDelete={() => {
                    setShowDeleteDialog(true);
                  }}
                  triggerClassName={classNames(
                    segmentedStyles.segment,
                    styles.footerSegment,
                  )}
                  triggerIconClassName={styles.footerSegmentIcon}
                />
              </>
            ) : (
              <>
                <PlaylistDrawerFooterActionsMenu
                  layout="edit"
                  hasDrawerStats={hasDrawerStats}
                  isBusy={isBusy}
                  isOpen={desktopEditMenu.isOpen}
                  onOpenChange={(open) => {
                    desktopEditMenu.setIsOpen(open);
                    if (open) {
                      setStatsPanelOpen(false);
                    }
                  }}
                  onRename={() => {
                    setShowRenameDialog(true);
                  }}
                  onDelete={() => {
                    setShowDeleteDialog(true);
                  }}
                  triggerClassName={classNames(
                    segmentedStyles.segment,
                    styles.footerSegment,
                  )}
                  triggerIconClassName={styles.footerSegmentIcon}
                />
                <IconButton
                  className={classNames(
                    segmentedStyles.segment,
                    styles.footerSegment,
                    {
                      [segmentedStyles.active]: statsPanelOpen,
                    },
                  )}
                  iconClassName={styles.footerSegmentIcon}
                  label="Stats"
                  disabled={!hasDrawerStats}
                  aria-expanded={statsPanelOpen}
                  aria-controls="fmdPlaylistDrawerStatsPanel"
                  onClick={() => {
                    desktopEditMenu.closeMenu();
                    setStatsPanelOpen(!statsPanelOpen);
                  }}
                  data-testid="fmdPlaylistDrawerStatsToggle"
                >
                  <TableIcon />
                </IconButton>
                {queueButton}
                {playButton}
              </>
            )}
          </SegmentedControl>
        </div>
        {isBelowDesktop ? null : <PlaylistShareControls />}
      </div>
      <CreatePlaylistDialog
        isOpen={showRenameDialog}
        isSubmitting={updatePlaylistMutation.isPending}
        initialName={playlist?.name ?? ""}
        initialPublicDescription={playlist?.publicDescription ?? ""}
        title="Rename playlist"
        description="Update the playlist name and optional public description."
        submitLabel="Save"
        loadingText="Saving..."
        onClose={() => {
          setShowRenameDialog(false);
        }}
        onCreate={handleRename}
      />
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
