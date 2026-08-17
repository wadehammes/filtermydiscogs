import { describe, expect, it } from "@jest/globals";
import {
  enableYoutubeIframeListening,
  isYoutubeEmbedOrigin,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_ENDED,
} from "./youtubeIframeEvents";

describe("isYoutubeEmbedOrigin", () => {
  it("accepts YouTube embed origins", () => {
    expect(isYoutubeEmbedOrigin("https://www.youtube-nocookie.com")).toBe(true);
    expect(isYoutubeEmbedOrigin("https://www.youtube.com")).toBe(true);
  });

  it("rejects other origins", () => {
    expect(isYoutubeEmbedOrigin("https://example.com")).toBe(false);
  });
});

describe("parseYoutubePlayerStateFromMessage", () => {
  it("parses onStateChange payloads", () => {
    expect(
      parseYoutubePlayerStateFromMessage(
        JSON.stringify({
          event: "onStateChange",
          info: YOUTUBE_PLAYER_STATE_ENDED,
        }),
      ),
    ).toBe(YOUTUBE_PLAYER_STATE_ENDED);
  });

  it("parses infoDelivery payloads", () => {
    expect(
      parseYoutubePlayerStateFromMessage(
        JSON.stringify({
          event: "infoDelivery",
          info: { playerState: YOUTUBE_PLAYER_STATE_ENDED },
        }),
      ),
    ).toBe(YOUTUBE_PLAYER_STATE_ENDED);
  });

  it("returns null for unrelated messages", () => {
    expect(parseYoutubePlayerStateFromMessage("not-json")).toBeNull();
    expect(
      parseYoutubePlayerStateFromMessage(
        JSON.stringify({ event: "onReady", info: 1 }),
      ),
    ).toBeNull();
  });
});

describe("enableYoutubeIframeListening", () => {
  it("posts the listening event to the iframe", () => {
    const postMessage = jest.fn();
    const iframe = {
      contentWindow: { postMessage },
    } as unknown as HTMLIFrameElement;

    enableYoutubeIframeListening(iframe);

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "listening",
        id: 1,
        channel: "widget",
      }),
      "*",
    );
  });
});
