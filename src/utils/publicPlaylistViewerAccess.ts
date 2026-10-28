import type { PublicPlaylistResponse } from "src/types/playlist.types";

export type PublicPlaylistViewerAuthState = {
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  username: string | null;
};

const normalizeShareUsername = (username: string | null | undefined) =>
  username?.trim().toLowerCase() ?? "";

export const resolvePublicPlaylistViewerIsOwner = (
  response: PublicPlaylistResponse,
  auth: PublicPlaylistViewerAuthState,
): boolean => {
  if (response.viewerIsOwner === true) {
    return true;
  }

  if (response.viewerIsOwner === false) {
    return false;
  }

  if (auth.isCheckingAuth) {
    return true;
  }

  if (auth.isAuthenticated && auth.username) {
    const playlistUsername = normalizeShareUsername(response.playlist.username);
    const viewerUsername = normalizeShareUsername(auth.username);

    if (playlistUsername && viewerUsername) {
      return playlistUsername === viewerUsername;
    }

    return true;
  }

  return false;
};

export const shouldShowPublicPlaylistTrackVotes = (
  response: PublicPlaylistResponse,
  auth: PublicPlaylistViewerAuthState,
): boolean => !resolvePublicPlaylistViewerIsOwner(response, auth);
