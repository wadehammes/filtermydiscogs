import { describe, expect, it } from "@jest/globals";
import {
  requestYoutubeEmbedPlaybackSync,
  syncYoutubeEmbedPlaybackProgress,
} from "./postYoutubePlayerCommand";

describe("syncYoutubeEmbedPlaybackProgress", () => {
  it("enables iframe listening then requests playback sync", () => {
    const postMessage = jest.fn();
    const iframe = {
      contentWindow: { postMessage },
    } as unknown as HTMLIFrameElement;

    syncYoutubeEmbedPlaybackProgress(iframe);

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "listening",
        id: 1,
        channel: "widget",
      }),
      "*",
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "getPlayerState",
        args: "",
      }),
      "*",
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "getCurrentTime",
        args: "",
      }),
      "*",
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "getDuration",
        args: "",
      }),
      "*",
    );
  });

  it("no-ops when the iframe is missing", () => {
    expect(() => {
      syncYoutubeEmbedPlaybackProgress(null);
    }).not.toThrow();
    expect(() => {
      requestYoutubeEmbedPlaybackSync(null);
    }).not.toThrow();
  });
});
