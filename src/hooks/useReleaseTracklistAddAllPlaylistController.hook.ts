"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReleasePlaylistPickerSubmenuPanelProps } from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import { useAuth } from "src/context/auth.context";
import {
  useAddTrackToPlaylistMutation,
  useCreatePlaylistMutation,
} from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { sortByDisplayName } from "src/utils/compareByDisplayName";
import { showPlaylistTracksAddedToast } from "src/utils/playlistToast";

export type UseReleaseTracklistAddAllPlaylistControllerOptions = {
  trackMetadataList: UserTrackMetadataBody[];
  releaseTitle: string;
  onRequestCloseMenu?: () => void;
  useOverlayStack?: boolean;
};

export const useReleaseTracklistAddAllPlaylistController = ({
  trackMetadataList,
  releaseTitle,
  onRequestCloseMenu,
  useOverlayStack = false,
}: UseReleaseTracklistAddAllPlaylistControllerOptions) => {
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

  const addAllToPlaylist = useCallback(
    async (playlistId: string, playlistName: string) => {
      if (trackMetadataList.length === 0) {
        return;
      }

      for (const metadata of trackMetadataList) {
        await addTrackMutation.mutateAsync({ playlistId, metadata });
      }

      showPlaylistTracksAddedToast(trackMetadataList.length, playlistName);
    },
    [addTrackMutation, trackMetadataList],
  );

  const handlePick = useCallback(
    (playlistId: string, playlistName: string, _containsTrack: boolean) =>
      addAllToPlaylist(playlistId, playlistName),
    [addAllToPlaylist],
  );

  const handleCreate = useCallback(
    async ({ name, publicDescription }: CreatePlaylistFormValues) => {
      const created = await createPlaylistMutation.mutateAsync({
        name: name.trim(),
        publicDescription,
      });
      await addAllToPlaylist(created.id, created.name);
      setShowCreateDialog(false);
    },
    [addAllToPlaylist, createPlaylistMutation],
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
    isAddTrackPending: addTrackMutation.isPending,
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
      description: `Create a playlist and add all playable tracks from “${releaseTitle}”.`,
      submitLabel: "Create and add",
    },
    submenuPanelProps,
  };
};
