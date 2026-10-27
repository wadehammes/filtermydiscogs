import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import type { PlaylistTrackVoteBody } from "src/lib/validation/playlistTrackVote.schemas";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type {
  PlaylistDetail,
  PlaylistSummary,
  PlaylistTrackVoteResponse,
  PublicPlaylistEngagementResponse,
  PublicPlaylistResponse,
} from "src/types/playlist.types";

export type UpdatePlaylistPayload = {
  name?: string;
  private?: boolean;
  publicDescription?: string | null;
};

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

export type FetchPlaylistsOptions = {
  trackKey?: string;
};

export const fetchPlaylists = async (
  options?: FetchPlaylistsOptions,
): Promise<PlaylistSummary[]> => {
  const params = new URLSearchParams();
  const trackKey = options?.trackKey?.trim();
  if (trackKey) {
    params.set("trackKey", trackKey);
  }

  const query = params.toString();
  const url = query ? `/api/playlists?${query}` : "/api/playlists";

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  const data = (await response.json()) as { playlists: PlaylistSummary[] };
  return data.playlists;
};

export type CreatePlaylistPayload = {
  name: string;
  publicDescription?: string;
};

export const createPlaylist = async ({
  name,
  publicDescription,
}: CreatePlaylistPayload): Promise<PlaylistSummary> => {
  const response = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name,
      ...(publicDescription !== undefined ? { publicDescription } : {}),
    }),
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

export const fetchPublicPlaylist = async (
  playlistId: string,
): Promise<PublicPlaylistResponse> => {
  const response = await fetch(
    `/api/playlists/public/${encodeURIComponent(playlistId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Playlist not found or is private");
    }

    await throwPlaylistApiError(response);
  }

  return response.json() as Promise<PublicPlaylistResponse>;
};

export const recordPublicPlaylistView = async (
  playlistId: string,
): Promise<PublicPlaylistEngagementResponse> => {
  const response = await fetch(
    `/api/playlists/public/${encodeURIComponent(playlistId)}/view`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (response.status === 404) {
    throw new ApiFetchError(404, "Playlist not found or is private");
  }

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  return response.json() as Promise<PublicPlaylistEngagementResponse>;
};

export const votePublicPlaylistTrack = async (
  playlistId: string,
  body: PlaylistTrackVoteBody,
): Promise<PlaylistTrackVoteResponse> => {
  const response = await fetch(
    `/api/playlists/public/${encodeURIComponent(playlistId)}/tracks/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  if (response.status === 404) {
    throw new ApiFetchError(404, "Playlist or track not found");
  }

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  return response.json() as Promise<PlaylistTrackVoteResponse>;
};

export const recordPublicPlaylistPlay = async (
  playlistId: string,
): Promise<PublicPlaylistEngagementResponse> => {
  const response = await fetch(
    `/api/playlists/public/${encodeURIComponent(playlistId)}/play`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (response.status === 404) {
    throw new ApiFetchError(404, "Playlist not found or is private");
  }

  if (!response.ok) {
    await throwPlaylistApiError(response);
  }

  return response.json() as Promise<PublicPlaylistEngagementResponse>;
};

export const updatePlaylist = async (
  playlistId: string,
  payload: UpdatePlaylistPayload,
): Promise<PlaylistDetail> => {
  const response = await fetch(
    `/api/playlists/${encodeURIComponent(playlistId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
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
