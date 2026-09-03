export type YoutubePlayerCommand =
  | "playVideo"
  | "pauseVideo"
  | "getPlayerState";

const postYoutubeIframeCommand = ({
  iframe,
  func,
  args = "",
}: {
  iframe: HTMLIFrameElement | null;
  func: YoutubePlayerCommand | "loadVideoById";
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

export const requestYoutubePlayerState = (
  iframe: HTMLIFrameElement | null,
): void => {
  postYoutubeIframeCommand({ iframe, func: "getPlayerState" });
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
