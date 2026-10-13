import { describe, expect, it } from "@jest/globals";
import {
  formatYoutubePlayerStateLabel,
  parseYoutubeEmbedTestMessage,
} from "src/utils/youtubeEmbedTestLog";
import {
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

describe("parseYoutubeEmbedTestMessage", () => {
  it("when onReady fires, returns a ready log line", () => {
    expect(
      parseYoutubeEmbedTestMessage(
        JSON.stringify({ event: "onReady", info: null }),
      ),
    ).toEqual({
      kind: "ready",
      message: "Player ready",
    });
  });

  it("when onError fires, maps the code to the same reason as playback skip toasts", () => {
    expect(
      parseYoutubeEmbedTestMessage(
        JSON.stringify({ event: "onError", info: 101 }),
      ),
    ).toEqual({
      kind: "error",
      message: "Embed error 101 — Cannot play in embedded player",
      errorCode: 101,
    });
  });

  it("when onStateChange fires, labels the player state", () => {
    expect(
      parseYoutubeEmbedTestMessage(
        JSON.stringify({
          event: "onStateChange",
          info: YOUTUBE_PLAYER_STATE_PLAYING,
        }),
      ),
    ).toEqual({
      kind: "state",
      message: "State: Playing (1)",
      playerState: YOUTUBE_PLAYER_STATE_PLAYING,
    });
  });

  it("when infoDelivery includes time, summarizes playback position", () => {
    expect(
      parseYoutubeEmbedTestMessage(
        JSON.stringify({
          event: "infoDelivery",
          info: {
            playerState: YOUTUBE_PLAYER_STATE_PAUSED,
            currentTime: 12.5,
            duration: 240,
          },
        }),
      ),
    ).toEqual({
      kind: "info",
      message: "infoDelivery — Paused (2) — 12.5s / 240s",
      playerState: YOUTUBE_PLAYER_STATE_PAUSED,
    });
  });

  it("when the payload is not from the embed API, returns null", () => {
    expect(parseYoutubeEmbedTestMessage("not-json")).toBeNull();
    expect(parseYoutubeEmbedTestMessage({ foo: 1 })).toBeNull();
  });
});

describe("formatYoutubePlayerStateLabel", () => {
  it("when the state is ended, returns Ended", () => {
    expect(formatYoutubePlayerStateLabel(YOUTUBE_PLAYER_STATE_ENDED)).toBe(
      "Ended",
    );
  });
});
