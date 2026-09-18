import { describe, expect, it } from "@jest/globals";
import {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  shouldAcceptEmbedPlayingConfirmation,
} from "src/utils/releasePlaybackEmbedConfirm";

describe("releasePlaybackEmbedConfirm", () => {
  it("rejects PLAYING confirmation immediately after embed load started", () => {
    const startedAt = 1000;

    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: startedAt,
        nowMs: startedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS - 1,
      }),
    ).toBe(false);
  });

  it("accepts PLAYING confirmation after the post-load delay", () => {
    const startedAt = 1000;

    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: startedAt,
        nowMs: startedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      }),
    ).toBe(true);
  });

  it("rejects PLAYING confirmation when imperative embed load never started", () => {
    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: null,
        nowMs: 5000,
      }),
    ).toBe(false);
  });
});
