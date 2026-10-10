import { describe, expect, it } from "@jest/globals";
import {
  getPlaybackSkipSentryReportCountForTests,
  reportPlaybackSkipToSentry,
  resetPlaybackSkipSentryReportCountForTests,
  resolvePlaybackSkipSentryLevel,
  resolvePlaybackSkipSource,
} from "src/lib/sentry/reportPlaybackSkip";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

describe("reportPlaybackSkipToSentry", () => {
  it("caps Sentry playback skip reports per session", () => {
    resetPlaybackSkipSentryReportCountForTests();

    for (let index = 0; index < 20; index += 1) {
      reportPlaybackSkipToSentry({
        errorCode: 101,
        trackLabel: `Track ${index}`,
        reason: "Unavailable",
      });
    }

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });

  it("classifies watchdog vs YouTube error codes", () => {
    expect(resolvePlaybackSkipSource(PLAYBACK_EMBED_UNAVAILABLE_FALLBACK)).toBe(
      "watchdog",
    );
    expect(resolvePlaybackSkipSource(101)).toBe("youtube");
    expect(resolvePlaybackSkipSentryLevel("watchdog")).toBe("warning");
    expect(resolvePlaybackSkipSentryLevel("youtube")).toBe("info");
  });
});
