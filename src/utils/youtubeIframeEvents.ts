export const YOUTUBE_PLAYER_STATE_ENDED = 0;
export const YOUTUBE_PLAYER_STATE_PLAYING = 1;
export const YOUTUBE_PLAYER_STATE_PAUSED = 2;
export const YOUTUBE_PLAYER_STATE_CUED = 5;

export const HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS = 1000;
export const EMBED_TRACK_SWITCH_PAUSE_GRACE_MS = 5000;
export const YOUTUBE_EMBED_END_TIME_TOLERANCE_SEC = 1;
export const EMBED_PLAYBACK_ENDED_DEBOUNCE_MS = 1500;

export type YoutubeInfoDelivery = {
  playerState?: number;
  currentTime?: number;
  duration?: number;
};

const YOUTUBE_EMBED_ORIGINS = new Set([
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
]);

export const isYoutubeEmbedOrigin = (origin: string): boolean =>
  YOUTUBE_EMBED_ORIGINS.has(origin);

const parseYoutubeErrorCode = (info: unknown): number | null => {
  if (typeof info === "number" && Number.isFinite(info)) {
    return info;
  }

  if (typeof info === "string" && info.trim() !== "") {
    const parsed = Number(info);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof info === "object" && info !== null) {
    if ("errorCode" in info) {
      const { errorCode } = info as { errorCode?: unknown };

      if (typeof errorCode === "number" && Number.isFinite(errorCode)) {
        return errorCode;
      }
    }

    if ("data" in info) {
      const { data } = info as { data?: unknown };
      const parsedData = parseYoutubeErrorCode(data);

      if (parsedData !== null) {
        return parsedData;
      }
    }
  }

  return null;
};

const isYoutubeEmbedErrorEvent = (event: string | undefined): boolean =>
  event === "onError" || event === "error";

export const parseYoutubeEmbedReadyFromMessage = (data: unknown): boolean => {
  if (typeof data !== "string") {
    return false;
  }

  try {
    const payload = JSON.parse(data) as { event?: string };

    return payload.event === "onReady";
  } catch {
    return false;
  }
};

export const parseYoutubePlayerErrorFromMessage = (
  data: unknown,
): number | null => {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const payload = JSON.parse(data) as {
      event?: string;
      info?: unknown;
    };

    if (!isYoutubeEmbedErrorEvent(payload.event)) {
      return null;
    }

    return parseYoutubeErrorCode(payload.info);
  } catch {
    return null;
  }
};

export const parseYoutubePlayerStateFromMessage = (
  data: unknown,
): number | null => {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const payload = JSON.parse(data) as {
      event?: string;
      info?: number | { playerState?: number };
    };

    if (payload.event === "onStateChange" && typeof payload.info === "number") {
      return payload.info;
    }

    if (
      payload.event === "infoDelivery" &&
      typeof payload.info === "object" &&
      payload.info !== null &&
      typeof payload.info.playerState === "number"
    ) {
      return payload.info.playerState;
    }
  } catch {
    return null;
  }

  return null;
};

export const parseYoutubeInfoDelivery = (
  data: unknown,
): YoutubeInfoDelivery | null => {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const payload = JSON.parse(data) as {
      event?: string;
      info?: {
        playerState?: number;
        currentTime?: number;
        duration?: number;
      };
    };

    if (payload.event !== "infoDelivery" || typeof payload.info !== "object") {
      return null;
    }

    if (payload.info === null) {
      return null;
    }

    const { playerState, currentTime, duration } = payload.info;

    if (
      playerState === undefined &&
      currentTime === undefined &&
      duration === undefined
    ) {
      return null;
    }

    return {
      ...(playerState !== undefined && { playerState }),
      ...(currentTime !== undefined && { currentTime }),
      ...(duration !== undefined && { duration }),
    };
  } catch {
    return null;
  }
};

export const isYoutubeEmbedAtOrPastEnd = (
  info: YoutubeInfoDelivery,
): boolean => {
  if (info.playerState === YOUTUBE_PLAYER_STATE_ENDED) {
    return true;
  }

  if (info.playerState === YOUTUBE_PLAYER_STATE_PLAYING) {
    return false;
  }

  if (info.duration === undefined || info.duration <= 0) {
    return false;
  }

  if (info.currentTime === undefined) {
    return false;
  }

  return (
    info.currentTime >= info.duration - YOUTUBE_EMBED_END_TIME_TOLERANCE_SEC
  );
};

export const enableYoutubeIframeListening = (
  iframe: HTMLIFrameElement | null,
): void => {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "listening",
      id: 1,
      channel: "widget",
    }),
    "*",
  );
};
