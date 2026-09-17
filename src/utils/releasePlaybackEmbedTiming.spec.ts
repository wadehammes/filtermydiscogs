import { describe, expect, it } from "@jest/globals";
import {
  nextEmbedTrackSwitchGraceUntil,
  shouldNotifyEmbedPlaybackEnded,
} from "src/utils/releasePlaybackEmbedTiming";
import {
  EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
  EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
} from "src/utils/youtubeIframeEvents";

describe("releasePlaybackEmbedTiming", () => {
  describe("shouldNotifyEmbedPlaybackEnded", () => {
    it("allows the first ended notification", () => {
      expect(
        shouldNotifyEmbedPlaybackEnded({
          lastEndedAtMs: 0,
          nowMs: 1_000,
          debounceMs: EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
        }),
      ).toBe(true);
    });

    it("debounces rapid ended events", () => {
      expect(
        shouldNotifyEmbedPlaybackEnded({
          lastEndedAtMs: 1_000,
          nowMs: 1_000 + EMBED_PLAYBACK_ENDED_DEBOUNCE_MS - 1,
          debounceMs: EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
        }),
      ).toBe(false);
    });
  });

  describe("nextEmbedTrackSwitchGraceUntil", () => {
    it("extends grace through the configured pause window", () => {
      const now = 5_000;

      expect(
        nextEmbedTrackSwitchGraceUntil({
          nowMs: now,
          graceMs: EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
        }),
      ).toBe(now + EMBED_TRACK_SWITCH_PAUSE_GRACE_MS);
    });
  });
});
