import { describe, expect, it } from "@jest/globals";
import {
  PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE,
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
    expect(
      resolvePlaybackSkipSource(PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE),
    ).toBe("public_report");
    expect(resolvePlaybackSkipSentryLevel("watchdog")).toBe("warning");
    expect(resolvePlaybackSkipSentryLevel("youtube")).toBe("info");
    expect(resolvePlaybackSkipSentryLevel("public_report")).toBe("info");
  });
});
