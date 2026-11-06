import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipUserReportCaptureOptions } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";

describe("buildPlaybackSkipUserReportCaptureOptions", () => {
  it("when user reported, keeps auto fingerprint and adds user report tags", () => {
    const options = buildPlaybackSkipUserReportCaptureOptions(
      playbackSkipLogEntryFactory.embedDisabledReport({
        trackLabel: "A1 False skip",
        reason: "Cannot embed",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      }),
      { category: "plays_on_youtube_not_here" },
    );

    expect(options.level).toBe("warning");
    expect(options.message).toContain("(user report)");
    expect(options.fingerprint).toEqual([
      "playback-skip",
      "youtube",
      "Cannot embed",
    ]);
    expect(options.tags["playback.user_report"]).toBe("true");
    expect(options.tags["playback.user_report_category"]).toBe(
      "plays_on_youtube_not_here",
    );
    expect(options.extra.userReported).toBe(true);
  });

  it("when user report includes a note, adds userNote extra", () => {
    const options = buildPlaybackSkipUserReportCaptureOptions(
      playbackSkipLogEntryFactory.embedDisabledReport({
        reason: "Cannot embed",
        context: undefined,
      }),
      { category: "other", note: "Happens every time" },
    );

    expect(options.extra.userNote).toBe("Happens every time");
  });
});
