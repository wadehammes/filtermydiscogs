import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipCaptureOptions } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";

describe("buildPlaybackSkipCaptureOptions", () => {
  it("when user reported, uses a distinct fingerprint and warning level", () => {
    const options = buildPlaybackSkipCaptureOptions(
      playbackSkipLogEntryFactory.embedUnavailableFallback({
        trackLabel: "A1 False skip",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      }),
      {
        userReported: true,
        userReport: { category: "plays_on_youtube_not_here" },
      },
    );

    expect(options.level).toBe("warning");
    expect(options.message).toContain("(user report)");
    expect(options.fingerprint).toEqual([
      "playback-skip",
      "user-report",
      "plays_on_youtube_not_here",
      "watchdog",
      "Private, removed, blocked, or still loading",
      "inst-a1",
    ]);
    expect(options.tags["playback.user_report"]).toBe("true");
    expect(options.tags["playback.user_report_category"]).toBe(
      "plays_on_youtube_not_here",
    );
    expect(options.extra.userNote).toBeUndefined();
  });

  it("when user report includes a note, adds userNote extra", () => {
    const options = buildPlaybackSkipCaptureOptions(
      playbackSkipLogEntryFactory.embedDisabledReport({
        trackLabel: "A1 Track",
        reason: "Cannot embed",
        context: undefined,
      }),
      {
        userReported: true,
        userReport: { category: "other", note: "Happens every time" },
      },
    );

    expect(options.extra.userNote).toBe("Happens every time");
  });
});
