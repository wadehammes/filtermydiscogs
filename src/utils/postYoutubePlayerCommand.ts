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
