import { describe, expect, it } from "@jest/globals";
import {
  resolveActivePlaybackTitle,
  resolveActiveTrackPosition,
  resolveIsPlaybackReady,
  resolvePlaybackVideoId,
} from "src/utils/releasePlaybackActivePresentation";

describe("releasePlaybackActivePresentation", () => {
  describe("resolveIsPlaybackReady", () => {
    it("is ready when transport is active and a playback video id is resolved", () => {
      expect(
        resolveIsPlaybackReady({
          isPlaying: true,
          playbackVideoId: "abc12345678",
        }),
      ).toBe(true);
    });

    it("is not ready without transport or a resolved playback video id", () => {
      expect(
        resolveIsPlaybackReady({
          isPlaying: false,
          playbackVideoId: "abc12345678",
        }),
      ).toBe(false);
      expect(
        resolveIsPlaybackReady({
          isPlaying: true,
          playbackVideoId: null,
        }),
      ).toBe(false);
    });
  });

  describe("resolvePlaybackVideoId", () => {
    it("prefers the embed override while a pending track is resolving", () => {
      expect(
        resolvePlaybackVideoId({
          pendingTrackPosition: "A1",
          pendingPreviewVideoUri: null,
          embedVideoId: "embed-id",
          activeVideoId: "active-id",
        }),
      ).toBe("embed-id");
    });

    it("falls back to the active track video when idle", () => {
      expect(
        resolvePlaybackVideoId({
          pendingTrackPosition: null,
          pendingPreviewVideoUri: null,
          embedVideoId: null,
          activeVideoId: "active-id",
        }),
      ).toBe("active-id");
    });
  });

  describe("resolveActivePlaybackTitle", () => {
    it("uses preview video title during release preview playback", () => {
      expect(
        resolveActivePlaybackTitle({
          isReleasePreview: true,
          previewTitle: "Full album",
          trackTitle: "Track one",
        }),
      ).toBe("Full album");
    });
  });

  describe("resolveActiveTrackPosition", () => {
    it("hides track position during preview playback", () => {
      expect(
        resolveActiveTrackPosition({
          isReleasePreview: true,
          trackPosition: "A1",
        }),
      ).toBeNull();
    });
  });
});
