import { describe, expect, it } from "@jest/globals";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import {
  findPendingPreviewVideo,
  isPlaybackReleaseDetailSynced,
  shouldClearTransportForMissingVideo,
  shouldResetActiveTrackIndex,
} from "src/utils/releasePlaybackPendingResolution";

describe("releasePlaybackPendingResolution", () => {
  describe("isPlaybackReleaseDetailSynced", () => {
    it("is true when release detail id matches the active release id", () => {
      expect(isPlaybackReleaseDetailSynced(42, 42)).toBe(true);
    });

    it("is false when release id or detail id is missing or mismatched", () => {
      expect(isPlaybackReleaseDetailSynced(null, 42)).toBe(false);
      expect(isPlaybackReleaseDetailSynced(42, undefined)).toBe(false);
      expect(isPlaybackReleaseDetailSynced(42, 99)).toBe(false);
    });
  });

  describe("findPendingPreviewVideo", () => {
    it("returns the matching preview video uri", () => {
      const video = discogsVideoFactory.build({
        uri: "https://youtube.com/watch?v=abc",
      });

      expect(
        findPendingPreviewVideo([video], "https://youtube.com/watch?v=abc"),
      ).toBe(video);
    });

    it("returns undefined when the uri is missing from the release videos", () => {
      expect(
        findPendingPreviewVideo([], "https://youtube.com/watch?v=missing"),
      ).toBeUndefined();
    });
  });

  describe("shouldClearTransportForMissingVideo", () => {
    it("clears transport when tracks exist but no youtube match for album playback", () => {
      expect(
        shouldClearTransportForMissingVideo({
          tracksLength: 3,
          activeVideoId: null,
          isReleasePreview: false,
        }),
      ).toBe(true);
    });

    it("does not clear during release preview or when a video id is present", () => {
      expect(
        shouldClearTransportForMissingVideo({
          tracksLength: 3,
          activeVideoId: "abc",
          isReleasePreview: false,
        }),
      ).toBe(false);
      expect(
        shouldClearTransportForMissingVideo({
          tracksLength: 3,
          activeVideoId: null,
          isReleasePreview: true,
        }),
      ).toBe(false);
    });
  });

  describe("shouldResetActiveTrackIndex", () => {
    it("resets when the active index is out of range and no track is pending", () => {
      expect(
        shouldResetActiveTrackIndex({
          tracksLength: 2,
          activeTrackIndex: 2,
          pendingTrackPosition: null,
        }),
      ).toBe(true);
    });

    it("waits while a pending track position is resolving", () => {
      expect(
        shouldResetActiveTrackIndex({
          tracksLength: 2,
          activeTrackIndex: 2,
          pendingTrackPosition: "A1",
        }),
      ).toBe(false);
    });
  });
});
