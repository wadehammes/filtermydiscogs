import { resolveYoutubeEmbedErrorReason } from "src/utils/playbackSkippedTrackLog";
import {
  parseYoutubeEmbedReadyFromMessage,
  parseYoutubeInfoDelivery,
  parseYoutubePlayerErrorFromMessage,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

export type YoutubeEmbedTestLogKind = "ready" | "error" | "state" | "info";

export type YoutubeEmbedTestLogLine = {
  kind: YoutubeEmbedTestLogKind;
  message: string;
  errorCode?: number;
  playerState?: number;
};

const PLAYER_STATE_LABELS: Record<number, string> = {
  [YOUTUBE_PLAYER_STATE_ENDED]: "Ended",
  [YOUTUBE_PLAYER_STATE_PLAYING]: "Playing",
  [YOUTUBE_PLAYER_STATE_PAUSED]: "Paused",
  [-1]: "Unstarted",
  3: "Buffering",
  [YOUTUBE_PLAYER_STATE_CUED]: "Cued",
};

export const formatYoutubePlayerStateLabel = (playerState: number): string =>
  PLAYER_STATE_LABELS[playerState] ?? `Unknown (${playerState})`;

export const parseYoutubeEmbedTestMessage = (
  data: unknown,
): YoutubeEmbedTestLogLine | null => {
  if (parseYoutubeEmbedReadyFromMessage(data)) {
    return { kind: "ready", message: "Player ready" };
  }

  const errorCode = parseYoutubePlayerErrorFromMessage(data);

  if (errorCode !== null) {
    return {
      kind: "error",
      message: `Embed error ${errorCode} — ${resolveYoutubeEmbedErrorReason(errorCode)}`,
      errorCode,
    };
  }

  const infoDelivery = parseYoutubeInfoDelivery(data);

  if (infoDelivery) {
    const parts: string[] = ["infoDelivery"];

    if (infoDelivery.playerState !== undefined) {
      parts.push(
        `${formatYoutubePlayerStateLabel(infoDelivery.playerState)} (${infoDelivery.playerState})`,
      );
    }

    if (
      infoDelivery.currentTime !== undefined &&
      infoDelivery.duration !== undefined
    ) {
      parts.push(`${infoDelivery.currentTime}s / ${infoDelivery.duration}s`);
    }

    return {
      kind: "info",
      message: parts.join(" — "),
      ...(infoDelivery.playerState !== undefined && {
        playerState: infoDelivery.playerState,
      }),
    };
  }

  const playerState = parseYoutubePlayerStateFromMessage(data);

  if (playerState !== null) {
    return {
      kind: "state",
      message: `State: ${formatYoutubePlayerStateLabel(playerState)} (${playerState})`,
      playerState,
    };
  }

  return null;
};
