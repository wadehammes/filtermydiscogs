const PLAYBACK_EMBED_DEBUG_STORAGE_KEY = "fmd_debug_playback_embed";

const readLocalStorageFlag = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(PLAYBACK_EMBED_DEBUG_STORAGE_KEY) === "1"
    );
  } catch {
    return false;
  }
};

export const isPlaybackEmbedWatchdogDebugEnabled = (): boolean =>
  readLocalStorageFlag();

export const logPlaybackEmbedWatchdogDebug = (
  step: string,
  payload?: Record<string, unknown>,
): void => {
  if (!readLocalStorageFlag()) {
    return;
  }

  if (payload === undefined) {
    console.info(`[fmd playback embed] ${step}`);
    return;
  }

  console.info(`[fmd playback embed] ${step}`, payload);
};
