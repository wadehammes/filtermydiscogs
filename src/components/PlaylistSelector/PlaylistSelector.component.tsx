"use client";

import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import Select from "src/components/Select/Select.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { useAuth } from "src/context/auth.context";
import { useCreatePlaylistMutation } from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistsQuery } from "src/hooks/queries/usePlaylistsQuery";
import type { CreatePlaylistFormValues } from "src/lib/validation/playlist.schemas";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import { sortByDisplayName } from "src/utils/compareByDisplayName";
import styles from "./PlaylistSelector.module.css";

export interface PlaylistSelectorProps {
  activePlaylistId: string | null;
  onPlaylistChange: (playlistId: string) => void;
  className?: string;
  enabled?: boolean;
  onAfterPlaylistCreate?: (playlistId: string) => void;
}

export const PlaylistSelector = ({
  activePlaylistId,
  onPlaylistChange,
  className,
  enabled = true,
  onAfterPlaylistCreate,
}: PlaylistSelectorProps) => {
  const {
    state: { userId },
  } = useAuth();
  const { data: playlists = [], isLoading } = usePlaylistsQuery({
    userId,
    enabled,
  });
  const createPlaylistMutation = useCreatePlaylistMutation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handlePlaylistChange = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string" && value) {
        onPlaylistChange(value);
      }
    },
    [onPlaylistChange],
  );

  const handleCreatePlaylist = useCallback(
    async ({ name }: CreatePlaylistFormValues) => {
      const created = await createPlaylistMutation.mutateAsync(name.trim());
      onPlaylistChange(created.id);
      onAfterPlaylistCreate?.(created.id);
      setIsCreateDialogOpen(false);
    },
    [createPlaylistMutation, onAfterPlaylistCreate, onPlaylistChange],
  );

  const options = useMemo(
    () =>
      sortByDisplayName(playlists, (playlist) => playlist.name).map(
        (playlist) => ({
          value: playlist.id,
          label: `${playlist.name} (${playlist.trackCount})`,
        }),
      ),
    [playlists],
  );

  if (isLoading) {
    return (
      <div
        className={classNames(styles.container, className)}
        data-testid="fmdPlaylistSelector"
      >
        <div className={styles.loading}>
          <Spinner size="sm" aria-label="Loading playlists" />
          <span>Loading playlists...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={classNames(styles.container, className)}
        data-testid="fmdPlaylistSelector"
      >
        <Select
          label="Select playlist"
          options={options}
          value={activePlaylistId ?? ""}
          onChange={handlePlaylistChange}
          placeholder="Select a playlist"
          className={styles.select}
        />
        <div className={styles.actions}>
          <IconButton
            variant="plus"
            className={styles.newPlaylistButton}
            iconClassName={styles.newPlaylistIcon}
            onClick={() => {
              setIsCreateDialogOpen(true);
            }}
            disabled={createPlaylistMutation.isPending}
            aria-label="New playlist"
          >
            <PlusIcon />
          </IconButton>
        </div>
      </div>
      <CreatePlaylistDialog
        isOpen={isCreateDialogOpen}
        isSubmitting={createPlaylistMutation.isPending}
        title="New playlist"
        description="Create a playlist for tracks from your collection."
        submitLabel="Create"
        onClose={() => {
          setIsCreateDialogOpen(false);
        }}
        onCreate={handleCreatePlaylist}
      />
    </>
  );
};
