import { describe, expect, it } from "@jest/globals";
import {
  classifyPlaybackYoutubeEmbedIframeMessage,
  resolveYoutubeEmbedIframeMessagePlayerState,
  shouldRequestYoutubeEmbedProgressResync,
} from "./playbackYoutubeEmbedIframeMessage";
import {
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "./youtubeIframeEvents";

describe("classifyPlaybackYoutubeEmbedIframeMessage", () => {
  it("classifies ready, error, info, and state messages in a stable order", () => {
    expect(
      classifyPlaybackYoutubeEmbedIframeMessage(
        JSON.stringify({ event: "onReady" }),
      ),
    ).toEqual({ kind: "ready" });

    expect(
      classifyPlaybackYoutubeEmbedIframeMessage(
        JSON.stringify({ event: "onError", info: 101 }),
      ),
    ).toEqual({ kind: "error", errorCode: 101 });

    expect(
      classifyPlaybackYoutubeEmbedIframeMessage(
        JSON.stringify({
          event: "infoDelivery",
          info: { currentTime: 2, duration: 180, playerState: 1 },
        }),
      ),
    ).toEqual({
      kind: "info",
      info: { currentTime: 2, duration: 180, playerState: 1 },
    });

    expect(
      classifyPlaybackYoutubeEmbedIframeMessage(
        JSON.stringify({
          event: "onStateChange",
          info: YOUTUBE_PLAYER_STATE_ENDED,
        }),
      ),
    ).toEqual({ kind: "state", playerState: YOUTUBE_PLAYER_STATE_ENDED });
  });

  it("returns ignored for unrelated postMessage payloads", () => {
    expect(classifyPlaybackYoutubeEmbedIframeMessage("not-json")).toEqual({
      kind: "ignored",
    });
  });
});

describe("shouldRequestYoutubeEmbedProgressResync", () => {
  it("when infoDelivery is PLAYING without time or duration, requests another sync", () => {
    expect(
      shouldRequestYoutubeEmbedProgressResync({
        playerState: YOUTUBE_PLAYER_STATE_PLAYING,
      }),
    ).toBe(true);
  });

  it("when infoDelivery includes currentTime or duration, does not request resync", () => {
    expect(
      shouldRequestYoutubeEmbedProgressResync({
        playerState: YOUTUBE_PLAYER_STATE_PLAYING,
        currentTime: 0,
      }),
    ).toBe(false);

    expect(
      shouldRequestYoutubeEmbedProgressResync({
        duration: 120,
      }),
    ).toBe(false);
  });
});

describe("resolveYoutubeEmbedIframeMessagePlayerState", () => {
  it("reads player state from info and state messages", () => {
    expect(
      resolveYoutubeEmbedIframeMessagePlayerState({
        kind: "info",
        info: { playerState: YOUTUBE_PLAYER_STATE_PLAYING },
      }),
    ).toBe(YOUTUBE_PLAYER_STATE_PLAYING);

    expect(
      resolveYoutubeEmbedIframeMessagePlayerState({
        kind: "state",
        playerState: YOUTUBE_PLAYER_STATE_ENDED,
      }),
    ).toBe(YOUTUBE_PLAYER_STATE_ENDED);
  });
});
