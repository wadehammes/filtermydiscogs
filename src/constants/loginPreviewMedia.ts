export const LOGIN_PREVIEW_YOUTUBE_VIDEO_ID = "8g-4ydF1A7U";

export const LOGIN_PREVIEW_VIDEO_URL = `https://www.youtube-nocookie.com/watch?v=${LOGIN_PREVIEW_YOUTUBE_VIDEO_ID}`;

export const LOGIN_PREVIEW_VIDEO_WIDTH = 1680;
export const LOGIN_PREVIEW_VIDEO_HEIGHT = 1080;

export const LOGIN_PREVIEW_VIDEO_ASPECT_RATIO = `${LOGIN_PREVIEW_VIDEO_WIDTH} / ${LOGIN_PREVIEW_VIDEO_HEIGHT}`;

export const LOGIN_PREVIEW_YOUTUBE_PLAYBACK_QUALITY = "hd1080" as const;

export const LOGIN_PREVIEW_YOUTUBE_PLAYER_CONFIG = {
  cc_load_policy: 0,
  fs: 0,
  iv_load_policy: 3,
  rel: 0,
  vq: LOGIN_PREVIEW_YOUTUBE_PLAYBACK_QUALITY,
} as const;

type LoginPreviewYoutubeElement = HTMLElement & {
  api?: {
    setPlaybackQuality?: (quality: string) => void;
  };
};

export const requestLoginPreviewHd1080 = (
  playerElement: HTMLElement | null,
): void => {
  const player = playerElement as LoginPreviewYoutubeElement | null;

  player?.api?.setPlaybackQuality?.(LOGIN_PREVIEW_YOUTUBE_PLAYBACK_QUALITY);
};
