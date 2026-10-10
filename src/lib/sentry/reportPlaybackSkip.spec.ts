import { describe, expect, it } from "@jest/globals";
import {
  buildPlaybackSkipSentryDetailLine,
  buildPlaybackSkipSentryMessage,
} from "src/lib/sentry/buildPlaybackSkipSentryEvent";
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

  it("uses a short Sentry message and a full detail line in extra", () => {
    const shared = {
      source: "youtube" as const,
      reason: "Cannot play in embedded player",
      trackLabel: "A1 Magma - Zorg (12), Eclipse",
      details: {
        trackPosition: "A1",
        trackTitle: "Magma",
        artist: "Zorg (12)",
        releaseTitle: "Eclipse",
        youtubeVideoId: "D28Y_SmFtbQ",
      },
    };

    expect(buildPlaybackSkipSentryMessage(shared)).toBe(
      "YouTube Embed Error - Cannot play in embedded player",
    );

    expect(buildPlaybackSkipSentryDetailLine(shared)).toBe(
      "A1 · Magma — Zorg (12) · Eclipse — yt:D28Y_SmFtbQ",
    );

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
      "Embed Load Watchdog (Slow Network) - Private, removed, blocked, or still loading",
    );

    expect(
      buildPlaybackSkipSentryDetailLine({
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
    ).toBe("A1 · Intro — Artist · Album — yt:dQw4w9WgXcQ");
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
