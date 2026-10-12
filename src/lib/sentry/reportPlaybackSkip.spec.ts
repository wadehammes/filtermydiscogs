import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  getPlaybackSkipSentryReportCountForTests,
  reportPlaybackSkipToSentry,
  reportUserPlaybackSkipToSentry,
  resetPlaybackSkipSentryReportCountForTests,
} from "src/lib/sentry/reportPlaybackSkip";

describe("reportPlaybackSkipToSentry", () => {
  beforeEach(() => {
    resetPlaybackSkipSentryReportCountForTests();
  });

  it("caps Sentry playback skip reports per session", () => {
    for (let index = 0; index < 20; index += 1) {
      reportPlaybackSkipToSentry({
        errorCode: 101,
        trackLabel: `Track ${index}`,
        reason: "Unavailable",
      });
    }

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });

  it("when user report, bypasses the session cap counter", () => {
    for (let index = 0; index < 20; index += 1) {
      reportPlaybackSkipToSentry({
        errorCode: 101,
        trackLabel: `Track ${index}`,
        reason: "Unavailable",
      });
    }

    reportUserPlaybackSkipToSentry({
      errorCode: 101,
      trackLabel: "A1 False skip",
      reason: "Cannot play in embedded player",
      context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
    });

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });
});
