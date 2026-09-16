import { describe, expect, it } from "@jest/globals";
import {
  enableYoutubeIframeListening,
  isYoutubeEmbedAtOrPastEnd,
  isYoutubeEmbedOrigin,
  parseYoutubeInfoDelivery,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PLAYING,
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

describe("parseYoutubeInfoDelivery", () => {
  it("parses playback position fields", () => {
    expect(
      parseYoutubeInfoDelivery(
        JSON.stringify({
          event: "infoDelivery",
          info: { currentTime: 212, duration: 212, playerState: 0 },
        }),
      ),
    ).toEqual({
      currentTime: 212,
      duration: 212,
      playerState: 0,
    });
  });
});

describe("isYoutubeEmbedAtOrPastEnd", () => {
  it("does not treat in-progress playback as ended from time alone", () => {
    expect(
      isYoutubeEmbedAtOrPastEnd({
        playerState: YOUTUBE_PLAYER_STATE_PLAYING,
        currentTime: 200,
        duration: 212,
      }),
    ).toBe(false);
  });

  it("treats paused playback at the end as ended", () => {
    expect(
      isYoutubeEmbedAtOrPastEnd({
        currentTime: 211.5,
        duration: 212,
      }),
    ).toBe(true);
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
