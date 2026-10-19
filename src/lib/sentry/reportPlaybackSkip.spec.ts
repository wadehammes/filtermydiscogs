import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  getPlaybackSkipSentryReportCountForTests,
  reportPlaybackSkipToSentry,
  reportUserPlaybackSkipToSentry,
  resetPlaybackSkipSentryReportCountForTests,
} from "src/lib/sentry/reportPlaybackSkip";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";

describe("reportPlaybackSkipToSentry", () => {
  beforeEach(() => {
    resetPlaybackSkipSentryReportCountForTests();
  });

  it("does not send embed watchdog skips to Sentry", () => {
    reportPlaybackSkipToSentry(
      playbackSkipLogEntryFactory.watchdogFallbackReport(),
    );

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(0);
  });

  it("caps Sentry playback skip reports per session", () => {
    for (let index = 0; index < 20; index += 1) {
      reportPlaybackSkipToSentry(
        playbackSkipLogEntryFactory.build({
          trackLabel: `Track ${index}`,
          reason: "Unavailable",
          context: undefined,
        }),
      );
    }

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });

  it("when user report, bypasses the session cap counter", () => {
    for (let index = 0; index < 20; index += 1) {
      reportPlaybackSkipToSentry(
        playbackSkipLogEntryFactory.build({
          trackLabel: `Track ${index}`,
          reason: "Unavailable",
          context: undefined,
        }),
      );
    }

    reportUserPlaybackSkipToSentry(
      playbackSkipLogEntryFactory.embedDisabledReport({
        trackLabel: "A1 False skip",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      }),
      { category: "wrong_video" },
    );

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });
});
