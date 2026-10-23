import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import {
  PlaylistQueryKeys,
  PlaylistsQueryKeys,
} from "src/hooks/queries/querykeys.constants";

const PLAYLISTS_LIST_STALE_MS = 5 * 60 * 1000;
const PLAYLISTS_LIST_GC_MS = 10 * 60 * 1000;
const PLAYLIST_DETAIL_STALE_MS = 2 * 60 * 1000;
const PLAYLIST_DETAIL_GC_MS = 5 * 60 * 1000;

export const playlistsQueryOptions = (
  userId: string | null,
  trackKey: string | null = null,
) =>
  queryOptions({
    queryKey: trackKey
      ? PlaylistsQueryKeys.byUserIdAndTrackKey(userId, trackKey)
      : PlaylistsQueryKeys.byUserId(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      return api.playlists(trackKey ? { trackKey } : undefined);
    },
    staleTime: PLAYLISTS_LIST_STALE_MS,
    gcTime: PLAYLISTS_LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

export const playlistQueryOptions = (
  userId: string | null,
  playlistId: string | null,
) =>
  queryOptions({
    queryKey: PlaylistQueryKeys.byUserAndId(userId, playlistId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      if (!playlistId) {
        throw new Error("Playlist ID missing");
      }

      return api.playlist(playlistId);
    },
    staleTime: PLAYLIST_DETAIL_STALE_MS,
    gcTime: PLAYLIST_DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

export interface UsePlaylistsQueryParams {
  userId: string | null;
  trackKey?: string | null;
  enabled?: boolean;
}

export const usePlaylistsQuery = ({
  userId,
  trackKey = null,
  enabled = true,
}: UsePlaylistsQueryParams) => {
  const normalizedTrackKey = trackKey?.trim() || null;

  return useQuery({
    ...playlistsQueryOptions(userId, normalizedTrackKey),
    enabled: enabled && !!userId,
  });
};

export interface UsePlaylistQueryParams {
  userId: string | null;
  playlistId: string | null;
  enabled?: boolean;
}

export const usePlaylistQuery = ({
  userId,
  playlistId,
  enabled = true,
}: UsePlaylistQueryParams) => {
  const isEnabled = enabled && Boolean(userId && playlistId);

  return useQuery({
    ...playlistQueryOptions(userId, playlistId),
    enabled: isEnabled,
  });
};
