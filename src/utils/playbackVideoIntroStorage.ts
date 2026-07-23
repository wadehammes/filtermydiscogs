export const PLAYBACK_VIDEO_INTRO_STORAGE_KEY =
  "filtermydiscogs_playback_video_intro_shown";

export const hasSeenPlaybackVideoIntro = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  return localStorage.getItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY) === "true";
};

export const markPlaybackVideoIntroSeen = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY, "true");
};

export const clearPlaybackVideoIntroSeen = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY);
};
