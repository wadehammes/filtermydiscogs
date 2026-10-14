import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { PlaylistDetail, PlaylistSummary } from "src/types/playlist.types";

const throwPlaylistApiError = async (response: Response): Promise<never> => {
  const errorData = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  const errorMessage =
    errorData?.error || `HTTP error! status: ${response.status}`;
  throw new ApiFetchError(
    response.status,
    errorMessage,
    parseRetryAfterMs(response),
  );
};

export const fetchPlaylists = async (): Promise<PlaylistSummary[]> => {
  const response = await fetch("/api/playlists", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  const data = (await response.json()) as { playlists: PlaylistSummary[] };
  return data.playlists;
};

export const createPlaylist = async (
  name: string,
): Promise<PlaylistSummary> => {
  const response = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  const data = (await response.json()) as { playlist: PlaylistSummary };
  return data.playlist;
};

export const fetchPlaylist = async (
  playlistId: string,
): Promise<PlaylistDetail> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  const data = (await response.json()) as { playlist: PlaylistDetail };
  return data.playlist;
};

export const updatePlaylist = async (
  playlistId: string,
  name: string,
): Promise<PlaylistDetail> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  const data = (await response.json()) as { playlist: PlaylistDetail };
  return data.playlist;
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}`,
    { method: "DELETE", credentials: "include" },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }
};

export const addTrackToPlaylist = async (
  playlistId: string,
  metadata: UserTrackMetadataBody,
): Promise<{ sort_order: number }> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(metadata),
    },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  return response.json() as Promise<{ sort_order: number }>;
};

export const removeTrackFromPlaylist = async (
  playlistId: string,
  trackKey: string,
): Promise<void> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ track_key: trackKey }),
    },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }
};

export const reorderPlaylistTracks = async (
  playlistId: string,
  trackKeys: string[],
): Promise<void> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ track_keys: trackKeys }),
    },
  );

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }
};
