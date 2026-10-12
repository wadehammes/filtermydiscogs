import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipCaptureOptions } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

describe("buildPlaybackSkipCaptureOptions", () => {
  it("when user reported, uses a distinct fingerprint and warning level", () => {
    const options = buildPlaybackSkipCaptureOptions(
      {
        errorCode: PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
        trackLabel: "A1 False skip",
        reason: "Private, removed, blocked, or still loading",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      },
      { userReported: true },
    );

    expect(options.level).toBe("warning");
    expect(options.message).toContain("(user report)");
    expect(options.fingerprint).toEqual([
      "playback-skip",
      "user-report",
      "watchdog",
      "Private, removed, blocked, or still loading",
      "inst-a1",
    ]);
    expect(options.tags["playback.user_report"]).toBe("true");
  });
});
