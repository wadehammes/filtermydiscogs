"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReleasePlaylistPickerSubmenuPanelProps } from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import { useAuth } from "src/context/auth.context";
import {
  useAddTrackToPlaylistMutation,
  useCreatePlaylistMutation,
  useRemoveTrackFromPlaylistEntryMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { sortByDisplayName } from "src/utils/compareByDisplayName";
import {
  showPlaylistTrackAddedToast,
  showPlaylistTrackRemovedToast,
} from "src/utils/playlistToast";

export type UseReleasePlaylistPickerControllerOptions = {
  metadata: UserTrackMetadataBody;
  trackTitle: string;
  onRequestCloseMenu?: () => void;
  useOverlayStack?: boolean;
};

export const useReleasePlaylistPickerController = ({
  metadata,
  trackTitle,
  onRequestCloseMenu,
  useOverlayStack = false,
}: UseReleasePlaylistPickerControllerOptions) => {
  const {
    state: { userId },
  } = useAuth();
  const { data: playlists = [], isLoading } = usePlaylistsQuery({
    userId,
    trackKey: metadata.track_key,
  });
  const addTrackMutation = useAddTrackToPlaylistMutation();
  const removeTrackMutation = useRemoveTrackFromPlaylistEntryMutation();
  const createPlaylistMutation = useCreatePlaylistMutation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const sortedPlaylists = useMemo(
    () => sortByDisplayName(playlists, (playlist) => playlist.name),
    [playlists],
  );

  const handlePick = useCallback(
    async (
      playlistId: string,
      playlistName: string,
      containsTrack: boolean,
    ) => {
      if (containsTrack) {
        await removeTrackMutation.mutateAsync({
          playlistId,
          trackKey: metadata.track_key,
        });
        showPlaylistTrackRemovedToast(playlistName);
        return;
      }

      await addTrackMutation.mutateAsync({ playlistId, metadata });
      showPlaylistTrackAddedToast(playlistName);
    },
    [addTrackMutation, metadata, removeTrackMutation],
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

  const openCreateDialog = useCallback(() => {
    onRequestCloseMenu?.();
    setShowCreateDialog(true);
  }, [onRequestCloseMenu]);

  const closeCreateDialog = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  const submenuPanelProps: ReleasePlaylistPickerSubmenuPanelProps = {
    useOverlayStack,
    isLoading,
    sortedPlaylists,
    isAddTrackPending:
      addTrackMutation.isPending || removeTrackMutation.isPending,
    onPickPlaylist: handlePick,
    onOpenCreateDialog: openCreateDialog,
  };

  return {
    createDialogProps: {
      isOpen: showCreateDialog,
      isSubmitting:
        createPlaylistMutation.isPending || addTrackMutation.isPending,
      onClose: closeCreateDialog,
      onCreate: handleCreate,
      title: "Create playlist",
      description: `Create a playlist and add “${trackTitle}”.`,
      submitLabel: "Create and add",
    },
    submenuPanelProps,
  };
};
