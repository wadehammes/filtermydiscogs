export const YOUTUBE_PLAYER_STATE_ENDED = 0;

const YOUTUBE_EMBED_ORIGINS = new Set([
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
]);

export const isYoutubeEmbedOrigin = (origin: string): boolean =>
  YOUTUBE_EMBED_ORIGINS.has(origin);

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
