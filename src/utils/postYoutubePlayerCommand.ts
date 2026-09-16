export type YoutubePlayerCommand =
  | "playVideo"
  | "pauseVideo"
  | "getPlayerState";

type YoutubeIframeFunc =
  | YoutubePlayerCommand
  | "loadVideoById"
  | "setSize"
  | "getCurrentTime"
  | "getDuration";

export const YOUTUBE_EMBED_PLAYER_WIDTH = 640;
export const YOUTUBE_EMBED_PLAYER_HEIGHT = 360;

const postYoutubeIframeCommand = ({
  iframe,
  func,
  args = "",
}: {
  iframe: HTMLIFrameElement | null;
  func: YoutubeIframeFunc;
  args?: string | unknown[];
}): void => {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func,
      args,
    }),
    "*",
  );
};

export const postYoutubePlayerCommand = ({
  iframe,
  command,
}: {
  iframe: HTMLIFrameElement | null;
  command: Exclude<YoutubePlayerCommand, "getPlayerState">;
}): void => {
  postYoutubeIframeCommand({ iframe, func: command });
};

const requestYoutubePlayerState = (iframe: HTMLIFrameElement | null): void => {
  postYoutubeIframeCommand({ iframe, func: "getPlayerState" });
};

export const requestYoutubeEmbedPlaybackSync = (
  iframe: HTMLIFrameElement | null,
): void => {
  if (!iframe) {
    return;
  }

  requestYoutubePlayerState(iframe);
  postYoutubeIframeCommand({ iframe, func: "getCurrentTime" });
  postYoutubeIframeCommand({ iframe, func: "getDuration" });
};

export const loadYoutubeVideoById = ({
  iframe,
  videoId,
  startSeconds = 0,
}: {
  iframe: HTMLIFrameElement | null;
  videoId: string;
  startSeconds?: number;
}): void => {
  postYoutubeIframeCommand({
    iframe,
    func: "loadVideoById",
    args: [videoId, startSeconds],
  });
};

export const transitionYoutubeIframeToVideo = ({
  iframe,
  videoId,
}: {
  iframe: HTMLIFrameElement | null;
  videoId: string;
}): void => {
  loadYoutubeVideoById({ iframe, videoId });
};

export const refreshYoutubeEmbedPlayerLayout = ({
  iframe,
  width = YOUTUBE_EMBED_PLAYER_WIDTH,
  height = YOUTUBE_EMBED_PLAYER_HEIGHT,
}: {
  iframe: HTMLIFrameElement | null;
  width?: number;
  height?: number;
}): void => {
  postYoutubeIframeCommand({
    iframe,
    func: "setSize",
    args: [width, height],
  });
};

export const loadAndPlayYoutubeVideo = ({
  iframe,
  videoId,
  startSeconds = 0,
}: {
  iframe: HTMLIFrameElement | null;
  videoId: string;
  startSeconds?: number;
}): void => {
  loadYoutubeVideoById({ iframe, videoId, startSeconds });
  postYoutubePlayerCommand({ iframe, command: "playVideo" });
};
