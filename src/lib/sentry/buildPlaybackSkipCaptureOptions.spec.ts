import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipCaptureOptions } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";

describe("buildPlaybackSkipCaptureOptions", () => {
  it("when embed unavailable, uses playback-skip fingerprint and user.visible tag", () => {
    const options = buildPlaybackSkipCaptureOptions(
      playbackSkipLogEntryFactory.embedUnavailableFallback({
        trackLabel: "A1 False skip",
        context: { trackKey: "inst-a1", youtubeVideoId: "abc123" },
      }),
    );

    expect(options.fingerprint).toEqual([
      "playback-skip",
      "watchdog",
      "Private, removed, blocked, or still loading",
    ]);
    expect(options.tags["user.visible"]).toBe("true");
    expect(options.tags["playback.skip_source"]).toBe("watchdog");
    expect(options.extra.userReported).toBe(false);
  });
});
