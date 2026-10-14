const LAST_PLAYED_PLAYLIST_STORAGE_PREFIX =
  "filtermydiscogs_last_played_playlist_";

const storageKeyForUser = (userId: string): string =>
  `${LAST_PLAYED_PLAYLIST_STORAGE_PREFIX}${userId}`;

export const readLastPlayedPlaylistId = (userId: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(storageKeyForUser(userId));

  return value && value.trim() !== "" ? value : null;
};

export const writeLastPlayedPlaylistId = (
  userId: string,
  playlistId: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(storageKeyForUser(userId), playlistId);
};

export const clearAllLastPlayedPlaylistIds = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(LAST_PLAYED_PLAYLIST_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
};
