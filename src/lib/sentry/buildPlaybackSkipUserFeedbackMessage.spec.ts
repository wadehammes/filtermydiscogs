import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipUserFeedbackMessage } from "src/lib/sentry/buildPlaybackSkipUserFeedbackMessage";
import { resolvePlaybackSkipSource } from "src/lib/sentry/playbackSkipSentrySource";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";

describe("buildPlaybackSkipUserFeedbackMessage", () => {
  it("when category and note are provided, includes labels and detail", () => {
    const payload = playbackSkipLogEntryFactory.embedDisabledReport({
      trackLabel: "A Turf Wars",
      reason: "Cannot play in embedded player",
      context: {
        trackKey: "2201518725:A",
        youtubeVideoId: "sLz22C_pCrM",
        releaseTitle: "Turf Wars",
        artist: "Steve O'Sullivan",
      },
    });

    const message = buildPlaybackSkipUserFeedbackMessage(
      payload,
      {
        category: "plays_on_youtube_not_here",
        note: "Works on youtube.com",
      },
      resolvePlaybackSkipSource(payload.errorCode),
    );

    expect(message).toContain("Plays on YouTube but not here");
    expect(message).toContain("Cannot play in embedded player");
    expect(message).toContain("yt:sLz22C_pCrM");
    expect(message).toContain("User note: Works on youtube.com");
  });
});
