"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerStats } from "src/components/PlaylistDrawerStats/PlaylistDrawerStats.component";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import { useAuth } from "src/context/auth.context";
import {
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { useActivePlaylistDetail } from "src/hooks/useActivePlaylistDetail.hook";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import EditIcon from "src/styles/icons/edit-thin.svg";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import PlayIcon from "src/styles/icons/play-thin.svg";
import TableIcon from "src/styles/icons/table-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { writeLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import { listPlaylistDrawerStatEntriesFromDetail } from "src/utils/playlistDrawerStats";
import { normalizePlaylistPublicDescriptionForStorage } from "src/utils/publicPlaylistDescription";
import styles from "./PlaylistDrawerFooter.module.css";

export const PlaylistDrawerFooter = () => {
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
  const [editMenuOpen, setEditMenuOpen] = useState(false);
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

  const closeEditMenu = useCallback(() => {
    setEditMenuOpen(false);
  }, []);

  const runEditMenuAction = useCallback(
    (action: () => void) => {
      closeEditMenu();
      action();
    },
    [closeEditMenu],
  );

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
            {activePlaylistId ? (
              <Menu.Root
                open={editMenuOpen}
                onOpenChange={(open) => {
                  setEditMenuOpen(open);
                  if (open) {
                    setStatsPanelOpen(false);
                  }
                }}
                modal={false}
              >
                <Menu.Trigger
                  render={(props) => (
                    <IconButton
                      {...props}
                      className={classNames(
                        segmentedStyles.segment,
                        styles.footerSegment,
                        {
                          [segmentedStyles.active]: editMenuOpen,
                        },
                      )}
                      iconClassName={styles.footerSegmentIcon}
                      label="Edit"
                      disabled={isBusy}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                />
                <InlinePopoverMenu.Panel
                  align="start"
                  side="top"
                  popupClassName={styles.editMenuPopup}
                  testId="fmdPlaylistDrawerEditMenu"
                  useOverlayStack={false}
                >
                  <InlinePopoverMenu.List>
                    <InlinePopoverMenu.Item
                      disabled={isBusy}
                      onClick={() => {
                        runEditMenuAction(() => {
                          setShowRenameDialog(true);
                        });
                      }}
                    >
                      <span className={styles.editMenuItemIcon} aria-hidden>
                        <EditIcon />
                      </span>
                      <span>Rename</span>
                    </InlinePopoverMenu.Item>
                    <InlinePopoverMenu.ItemDanger
                      disabled={isBusy}
                      onClick={() => {
                        runEditMenuAction(() => {
                          setShowDeleteDialog(true);
                        });
                      }}
                    >
                      <span className={styles.editMenuItemIcon} aria-hidden>
                        <TrashOpenIcon />
                      </span>
                      <span>Delete</span>
                    </InlinePopoverMenu.ItemDanger>
                  </InlinePopoverMenu.List>
                </InlinePopoverMenu.Panel>
              </Menu.Root>
            ) : (
              <span
                className={classNames(
                  segmentedStyles.segment,
                  styles.footerSegment,
                )}
                aria-disabled="true"
              >
                <span className={styles.footerSegmentIcon} aria-hidden>
                  <EditIcon />
                </span>
                <span>Edit</span>
              </span>
            )}
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
                closeEditMenu();
                setStatsPanelOpen(!statsPanelOpen);
              }}
              data-testid="fmdPlaylistDrawerStatsToggle"
            >
              <TableIcon />
            </IconButton>
            <IconButton
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
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
        </div>
        <PlaylistShareControls />
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
