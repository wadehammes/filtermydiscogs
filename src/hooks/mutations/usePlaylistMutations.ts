import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { useAuth } from "src/context/auth.context";
import {
  PlaylistQueryKeys,
  PlaylistsQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { PlaylistDetail } from "src/types/playlist.types";
import { toast } from "src/utils/toast";

type ReorderPlaylistTracksVariables = {
  trackKeys: string[];
  previousPlaylist: PlaylistDetail;
  optimisticPlaylist: PlaylistDetail;
};

type ReorderPlaylistTracksContext = {
  previousPlaylist: PlaylistDetail;
  queryKey: ReturnType<typeof PlaylistQueryKeys.byUserAndId>;
};

const invalidatePlaylists = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  playlistId?: string,
) => {
  if (userId) {
    queryClient.invalidateQueries({
      queryKey: PlaylistsQueryKeys.byUserId(userId),
    });
  }

  if (userId && playlistId) {
    queryClient.invalidateQueries({
      queryKey: PlaylistQueryKeys.byUserAndId(userId, playlistId),
    });
  }
};

export const useCreatePlaylistMutation = () => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: (name: string) => api.createPlaylist(name),
    onSuccess: () => {
      invalidatePlaylists(queryClient, userId ?? null);
    },
    onError: () => {
      toast.error("Failed to create playlist");
    },
  });
};

export const useDeletePlaylistMutation = () => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: (playlistId: string) => api.deletePlaylist(playlistId),
    onSuccess: (_data, playlistId) => {
      invalidatePlaylists(queryClient, userId ?? null, playlistId);
    },
    onError: () => {
      toast.error("Failed to delete playlist");
    },
  });
};

export const useAddTrackToPlaylistMutation = () => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: ({
      playlistId,
      metadata,
    }: {
      playlistId: string;
      metadata: UserTrackMetadataBody;
    }) => api.addTrackToPlaylist(playlistId, metadata),
    onSuccess: (_data, { playlistId }) => {
      invalidatePlaylists(queryClient, userId ?? null, playlistId);
    },
    onError: (error: Error) => {
      if (error.message.includes("already in this playlist")) {
        toast.error("Track is already in this playlist");
        return;
      }

      toast.error("Failed to add track to playlist");
    },
  });
};

export const useRemoveTrackFromPlaylistMutation = (playlistId: string) => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: (trackKey: string) =>
      api.removeTrackFromPlaylist(playlistId, trackKey),
    onSuccess: () => {
      invalidatePlaylists(queryClient, userId ?? null, playlistId);
    },
    onError: () => {
      toast.error("Failed to remove track from playlist");
    },
  });
};

export const useRemoveTrackFromPlaylistEntryMutation = () => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: ({
      playlistId,
      trackKey,
    }: {
      playlistId: string;
      trackKey: string;
    }) => api.removeTrackFromPlaylist(playlistId, trackKey),
    onSuccess: (_data, { playlistId }) => {
      invalidatePlaylists(queryClient, userId ?? null, playlistId);
    },
    onError: () => {
      toast.error("Failed to remove track from playlist");
    },
  });
};

export const useReorderPlaylistTracksMutation = (playlistId: string) => {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();

  return useMutation({
    mutationFn: ({ trackKeys }: ReorderPlaylistTracksVariables) =>
      api.reorderPlaylistTracks(playlistId, trackKeys),
    onMutate: async ({ previousPlaylist, optimisticPlaylist }) => {
      if (!userId) {
        return undefined;
      }

      const queryKey = PlaylistQueryKeys.byUserAndId(userId, playlistId);

      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData(queryKey, optimisticPlaylist);

      return {
        previousPlaylist,
        queryKey,
      } satisfies ReorderPlaylistTracksContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlaylist) {
        queryClient.setQueryData(context.queryKey, context.previousPlaylist);
      }

      toast.error("Failed to reorder playlist");
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: PlaylistsQueryKeys.byUserId(userId),
        });
      }
    },
  });
};
