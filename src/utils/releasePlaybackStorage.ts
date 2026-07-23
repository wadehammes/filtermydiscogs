export const RELEASE_PLAYBACK_STORAGE_KEY = "filtermydiscogs_release_playback";

export interface PersistedReleasePlayback {
  instanceId: string;
  trackPosition: string;
}

const isPersistedReleasePlayback = (
  value: unknown,
): value is PersistedReleasePlayback => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PersistedReleasePlayback;

  return (
    typeof candidate.instanceId === "string" &&
    candidate.instanceId.length > 0 &&
    typeof candidate.trackPosition === "string" &&
    candidate.trackPosition.length > 0
  );
};

export const readPersistedReleasePlayback =
  (): PersistedReleasePlayback | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = localStorage.getItem(RELEASE_PLAYBACK_STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);

      if (!isPersistedReleasePlayback(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

export const writePersistedReleasePlayback = (
  playback: PersistedReleasePlayback,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(RELEASE_PLAYBACK_STORAGE_KEY, JSON.stringify(playback));
};

export const clearPersistedReleasePlayback = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(RELEASE_PLAYBACK_STORAGE_KEY);
};
