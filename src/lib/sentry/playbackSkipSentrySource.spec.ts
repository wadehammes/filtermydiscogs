import { describe, expect, it } from "@jest/globals";
import {
  resolvePlaybackSkipSentryLevel,
  resolvePlaybackSkipSource,
} from "src/lib/sentry/playbackSkipSentrySource";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

describe("playbackSkipSentrySource", () => {
  it("classifies watchdog vs YouTube error codes", () => {
    expect(resolvePlaybackSkipSource(PLAYBACK_EMBED_UNAVAILABLE_FALLBACK)).toBe(
      "watchdog",
    );
    expect(resolvePlaybackSkipSource(101)).toBe("youtube");
    expect(resolvePlaybackSkipSentryLevel("watchdog")).toBe("warning");
    expect(resolvePlaybackSkipSentryLevel("youtube")).toBe("info");
  });
});
