import {
  parseYoutubeEmbedReadyFromMessage,
  parseYoutubeInfoDelivery,
  parseYoutubePlayerErrorFromMessage,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_PLAYING,
  type YoutubeInfoDelivery,
} from "src/utils/youtubeIframeEvents";

export type PlaybackYoutubeEmbedIframeMessage =
  | { kind: "ignored" }
  | { kind: "ready" }
  | { kind: "error"; errorCode: number }
  | { kind: "info"; info: YoutubeInfoDelivery }
  | { kind: "state"; playerState: number };

export const classifyPlaybackYoutubeEmbedIframeMessage = (
  data: unknown,
): PlaybackYoutubeEmbedIframeMessage => {
  if (parseYoutubeEmbedReadyFromMessage(data)) {
    return { kind: "ready" };
  }

  const errorCode = parseYoutubePlayerErrorFromMessage(data);

  if (errorCode !== null) {
    return { kind: "error", errorCode };
  }

  const infoDelivery = parseYoutubeInfoDelivery(data);

  if (infoDelivery) {
    return { kind: "info", info: infoDelivery };
  }

  const playerState = parseYoutubePlayerStateFromMessage(data);

  if (playerState !== null) {
    return { kind: "state", playerState };
  }

  return { kind: "ignored" };
};

export const shouldRequestYoutubeEmbedProgressResync = (
  info: YoutubeInfoDelivery,
): boolean => {
  if (info.currentTime !== undefined || info.duration !== undefined) {
    return false;
  }

  return info.playerState === YOUTUBE_PLAYER_STATE_PLAYING;
};

export const resolveYoutubeEmbedIframeMessagePlayerState = (
  message: PlaybackYoutubeEmbedIframeMessage,
): number | null => {
  if (message.kind === "info") {
    return message.info.playerState ?? null;
  }

  if (message.kind === "state") {
    return message.playerState;
  }

  return null;
};
