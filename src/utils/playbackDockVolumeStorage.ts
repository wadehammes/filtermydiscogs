import { PLAYBACK_DOCK_VOLUME_STORAGE_KEY } from "src/constants/storageKeys";

export const DEFAULT_PLAYBACK_DOCK_VOLUME = 100;
const MIN_VOLUME = 0;
const MAX_VOLUME = 100;

const clampVolume = (volume: number): number =>
  Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, Math.round(volume)));

export const readPlaybackDockVolume = (): number => {
  if (typeof window === "undefined") {
    return DEFAULT_PLAYBACK_DOCK_VOLUME;
  }

  const stored = localStorage.getItem(PLAYBACK_DOCK_VOLUME_STORAGE_KEY);

  if (stored === null) {
    return DEFAULT_PLAYBACK_DOCK_VOLUME;
  }

  const parsed = Number(stored);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_PLAYBACK_DOCK_VOLUME;
  }

  return clampVolume(parsed);
};

export const writePlaybackDockVolume = (volume: number): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    PLAYBACK_DOCK_VOLUME_STORAGE_KEY,
    String(clampVolume(volume)),
  );
};

export const clearPlaybackDockVolume = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(PLAYBACK_DOCK_VOLUME_STORAGE_KEY);
};
