import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  formatPlaybackSkipLogTitle,
  playbackSkipLogDedupeKey,
  playbackSkipLogEntryKey,
  resolvePlaybackSkipLogDisplay,
  resolveYoutubeEmbedErrorReason,
} from "src/utils/playbackSkippedTrackLog";

describe("playbackSkippedTrackLog", () => {
  it("when YouTube embed error 100, maps to private or removed copy", () => {
    expect(resolveYoutubeEmbedErrorReason(100)).toBe(
      "Private or removed on YouTube",
    );
  });

  it("when legacy YouTube embed error 0, maps to private or removed copy", () => {
    expect(resolveYoutubeEmbedErrorReason(0)).toBe(
      "Private or removed on YouTube",
    );
  });

  it("when embed-disabled codes, maps to embedding copy", () => {
    expect(resolveYoutubeEmbedErrorReason(101)).toBe(
      "Cannot play in embedded player",
    );
    expect(resolveYoutubeEmbedErrorReason(150)).toBe(
      "Cannot play in embedded player",
    );
  });

  it("when one skipped track, uses singular toast title", () => {
    expect(formatPlaybackSkipLogTitle(1)).toBe("Skipped unavailable track");
  });

  it("when multiple skipped tracks, uses plural toast title", () => {
    expect(formatPlaybackSkipLogTitle(3)).toBe("Skipped 3 unavailable tracks");
  });

  it("when deduping skip log rows, uses the track label", () => {
    expect(
      playbackSkipLogDedupeKey({
        trackLabel: "B2 Labyrinth - Various, HDZ 06",
      }),
    ).toBe("B2 Labyrinth - Various, HDZ 06");
  });

  it("when trackKey is present, playbackSkipLogEntryKey uses trackKey and errorCode", () => {
    expect(
      playbackSkipLogEntryKey({
        errorCode: 101,
        trackLabel: "A1 Track - Artist, Album",
        reason: "Cannot play in embedded player",
        context: { trackKey: "inst-a1" },
      }),
    ).toBe("inst-a1:101");
  });

  it("when trackKey is absent, playbackSkipLogEntryKey uses errorCode trackLabel and reason", () => {
    expect(
      playbackSkipLogEntryKey({
        errorCode: 100,
        trackLabel: "B2 Labyrinth - Various, HDZ 06",
        reason: "Private or removed on YouTube",
      }),
    ).toBe("100:B2 Labyrinth - Various, HDZ 06:Private or removed on YouTube");
  });

  it("when resolving display for the active album track, formats track line with release tail", () => {
    const release = releaseFactory.withDisplayDefaults();
    const tracks = [
      discogsTrackFactory.build({
        position: "B1",
        title: "Deep Track",
        type_: "track",
      }),
    ];

    expect(
      resolvePlaybackSkipLogDisplay({
        release,
        tracks,
        activeTrackIndex: 0,
        previewVideo: null,
      }),
    ).toEqual({
      trackLabel: "B1 Deep Track - Test Artist, Test Album",
    });
  });
});
