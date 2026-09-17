import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  formatPlaybackSkipLogTitle,
  resolvePlaybackSkipTrackLabel,
  resolveYoutubeEmbedErrorReason,
} from "src/utils/playbackSkippedTrackLog";

describe("resolveYoutubeEmbedErrorReason", () => {
  it("maps YouTube embed error 100 to private or removed copy", () => {
    expect(resolveYoutubeEmbedErrorReason(100)).toBe(
      "Private or removed on YouTube",
    );
  });

  it("maps legacy YouTube embed error 0 to private or removed copy", () => {
    expect(resolveYoutubeEmbedErrorReason(0)).toBe(
      "Private or removed on YouTube",
    );
  });

  it("maps embed-disabled codes to embedding copy", () => {
    expect(resolveYoutubeEmbedErrorReason(101)).toBe(
      "Cannot play in embedded player",
    );
    expect(resolveYoutubeEmbedErrorReason(150)).toBe(
      "Cannot play in embedded player",
    );
  });
});

describe("formatPlaybackSkipLogTitle", () => {
  it("uses singular title for one skipped track", () => {
    expect(formatPlaybackSkipLogTitle(1)).toBe("Skipped unavailable track");
  });

  it("uses plural title for multiple skipped tracks", () => {
    expect(formatPlaybackSkipLogTitle(3)).toBe("Skipped 3 unavailable tracks");
  });
});

describe("resolvePlaybackSkipTrackLabel", () => {
  it("formats artist, position, and title for the active album track", () => {
    const release = releaseFactory.withDisplayDefaults();
    const tracks = [
      discogsTrackFactory.build({
        position: "B1",
        title: "Deep Track",
        type_: "track",
      }),
    ];

    expect(
      resolvePlaybackSkipTrackLabel({
        release,
        tracks,
        activeTrackIndex: 0,
        previewVideo: null,
      }),
    ).toContain("B1");
    expect(
      resolvePlaybackSkipTrackLabel({
        release,
        tracks,
        activeTrackIndex: 0,
        previewVideo: null,
      }),
    ).toContain("Deep Track");
  });
});
