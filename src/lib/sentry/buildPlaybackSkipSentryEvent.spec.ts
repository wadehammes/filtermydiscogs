import { describe, expect, it } from "@jest/globals";
import {
  buildPlaybackSkipSentryDetailLine,
  buildPlaybackSkipSentryMessage,
} from "src/lib/sentry/buildPlaybackSkipSentryEvent";

describe("buildPlaybackSkipSentryEvent", () => {
  it("builds a short Sentry message and a full detail line", () => {
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
      "YouTube Embed Error - Cannot play in embedded player - yt:D28Y_SmFtbQ",
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
      "Embed Load Watchdog (Slow Network) - Private, removed, blocked, or still loading - yt:dQw4w9WgXcQ",
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
});
