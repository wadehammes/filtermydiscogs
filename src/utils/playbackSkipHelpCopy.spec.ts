import { describe, expect, it } from "@jest/globals";
import {
  PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
  resolvePlaybackEmbedUnavailableReason,
} from "src/utils/playbackEmbedUnavailableSkip";
import {
  PLAYBACK_SKIP_HELP_SECTIONS,
  PLAYBACK_SKIP_HELP_TRIGGER_LABEL,
} from "src/utils/playbackSkipHelpCopy";
import { resolveYoutubeEmbedErrorReason } from "src/utils/playbackSkippedTrackLog";

describe("playbackSkipHelpCopy", () => {
  it("when help sections are defined, each toast skip reason has matching copy", () => {
    const helpReasons = new Set(
      PLAYBACK_SKIP_HELP_SECTIONS.map((section) => section.reason),
    );

    expect(helpReasons.has(resolveYoutubeEmbedErrorReason(100))).toBe(true);
    expect(helpReasons.has(resolveYoutubeEmbedErrorReason(101))).toBe(true);
    expect(helpReasons.has(resolveYoutubeEmbedErrorReason(2))).toBe(true);
    expect(helpReasons.has(resolveYoutubeEmbedErrorReason(5))).toBe(true);
    expect(helpReasons.has(resolveYoutubeEmbedErrorReason(999))).toBe(true);
    expect(
      helpReasons.has(
        resolvePlaybackEmbedUnavailableReason(
          PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
        ),
      ),
    ).toBe(true);
  });

  it("when help sections are defined, each entry includes reason and detail text", () => {
    for (const section of PLAYBACK_SKIP_HELP_SECTIONS) {
      expect(section.reason.trim().length).toBeGreaterThan(0);
      expect(section.detail.trim().length).toBeGreaterThan(0);
    }
  });

  it("when trigger label is set, it matches the dialog title voice", () => {
    expect(PLAYBACK_SKIP_HELP_TRIGGER_LABEL).toBe("Why tracks skip");
  });
});
