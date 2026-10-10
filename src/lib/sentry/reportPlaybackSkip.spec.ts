import { describe, expect, it } from "@jest/globals";
import { buildPlaybackSkipSentryMessage } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
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

  it("builds a readable Sentry message with track, release, and youtube id", () => {
    expect(
      buildPlaybackSkipSentryMessage({
        source: "watchdog",
        reason: "Private, removed, blocked, or still loading",
        trackLabel: "fallback label",
        details: {
          connectionQuality: "slow",
          trackPosition: "A1",
          trackTitle: "Intro",
          artist: "Artist",
          releaseTitle: "Album",
          youtubeVideoId: "dQw4w9WgXcQ",
        },
      }),
    ).toBe(
      "Embed load watchdog (slow network) — A1 · Intro — Artist · Album — yt:dQw4w9WgXcQ",
    );

    expect(
      buildPlaybackSkipSentryMessage({
        source: "youtube",
        reason: "Cannot play in embedded player",
        trackLabel: "A1 Intro - Artist, Album",
        details: {
          trackPosition: "B2",
          trackTitle: "Deep cut",
          userYoutubeOverrideId: "override11",
        },
      }),
    ).toBe(
      "YouTube embed error — B2 · Deep cut — Cannot play in embedded player — yt:override11",
    );
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
