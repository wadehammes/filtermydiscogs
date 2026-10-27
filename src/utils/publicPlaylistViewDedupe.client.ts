import { PUBLIC_PLAYLIST_VIEW_DEDUPE_MS } from "src/constants/publicPlaylistEngagement.constants";

const publicPlaylistViewStorageKey = (playlistId: string) =>
  `fmd-public-playlist-view:${playlistId}`;

const recordedViewPlaylistIds = new Set<string>();

export const hasRecentPublicPlaylistViewRecord = (
  playlistId: string,
): boolean => {
  if (recordedViewPlaylistIds.has(playlistId)) {
    return true;
  }

  if (typeof localStorage === "undefined") {
    return false;
  }

  const storageKey = publicPlaylistViewStorageKey(playlistId);
  const storedViewRecordJson = localStorage.getItem(storageKey);

  if (!storedViewRecordJson) {
    return false;
  }

  try {
    const parsedViewRecord = JSON.parse(storedViewRecordJson) as {
      recordedAt?: number;
    };

    if (
      typeof parsedViewRecord.recordedAt === "number" &&
      Date.now() - parsedViewRecord.recordedAt < PUBLIC_PLAYLIST_VIEW_DEDUPE_MS
    ) {
      recordedViewPlaylistIds.add(playlistId);
      return true;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  return false;
};

export const markPublicPlaylistViewRecordedInClient = (
  playlistId: string,
): void => {
  recordedViewPlaylistIds.add(playlistId);

  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(
    publicPlaylistViewStorageKey(playlistId),
    JSON.stringify({ recordedAt: Date.now() }),
  );
};
