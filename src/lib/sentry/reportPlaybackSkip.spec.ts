import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { deliverSentryClientCapture } from "src/lib/sentry/deliverSentryClientCapture.client";
import {
  getPlaybackSkipSentryReportCountForTests,
  reportPlaybackSkipToSentry,
  reportUserPlaybackSkipToSentry,
  resetPlaybackSkipSentryReportCountForTests,
} from "src/lib/sentry/reportPlaybackSkip";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import { getMockedExport } from "src/tests/mocks/getMockedExport";
import { YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE } from "src/utils/playbackSkippedTrackLog";

jest.mock("src/lib/sentry/deliverSentryClientCapture.client", () => ({
  deliverSentryClientCapture: jest.fn(async (capture: () => void) => {
    capture();
    return true;
  }),
}));

const mockDeliverSentryClientCapture = getMockedExport<
  typeof deliverSentryClientCapture
>(
  "src/lib/sentry/deliverSentryClientCapture.client",
  "deliverSentryClientCapture",
);

describe("reportPlaybackSkipToSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeliverSentryClientCapture.mockImplementation(async (capture) => {
      capture();
      return true;
    });
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
          errorCode: YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
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
          errorCode: YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
        }),
      );
    }

    void reportUserPlaybackSkipToSentry(
      playbackSkipLogEntryFactory.embedDisabledReport({
        trackLabel: "A1 False skip",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      }),
      { category: "wrong_video" },
    );

    expect(getPlaybackSkipSentryReportCountForTests()).toBe(15);
  });
});
