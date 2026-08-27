export type YoutubePlayerCommand = "playVideo" | "pauseVideo";

export const postYoutubePlayerCommand = ({
  iframe,
  command,
}: {
  iframe: HTMLIFrameElement | null;
  command: YoutubePlayerCommand;
}): void => {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args: "",
    }),
    "*",
  );
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
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: "loadVideoById",
      args: [videoId, startSeconds],
    }),
    "*",
  );
};

export const transitionYoutubeIframeToVideo = ({
  iframe,
  videoId,
}: {
  iframe: HTMLIFrameElement | null;
  videoId: string;
}): void => {
  loadYoutubeVideoById({ iframe, videoId });
  postYoutubePlayerCommand({ iframe, command: "playVideo" });
};
