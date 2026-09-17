import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { buildReleasePlaybackMatchIndex } from "src/utils/releasePlayback";
import {
  resolveActivePlaybackTitle,
  resolveActivePlaybackVideo,
  resolveActiveTrackPosition,
  resolveActiveVideoId,
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

    it("prefers embed video id while active track index has not caught up yet", () => {
      expect(
        resolvePlaybackVideoId({
          pendingTrackPosition: null,
          pendingPreviewVideoUri: null,
          embedVideoId: "next-track-id",
          activeVideoId: "previous-track-id",
        }),
      ).toBe("next-track-id");
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

  describe("resolveActivePlaybackVideo", () => {
    it("prefers preview video over track matches", () => {
      const preview = discogsVideoFactory.build({ title: "Preview" });
      const track = discogsTrackFactory.build({
        position: "A1",
        title: "Track",
      });
      const videos = [discogsVideoFactory.build()];
      const playbackMatchIndex = buildReleasePlaybackMatchIndex(
        [track],
        videos,
      );

      expect(
        resolveActivePlaybackVideo({
          previewVideo: preview,
          activeTrack: track,
          videos,
          playbackMatchIndex,
        }),
      ).toBe(preview);
    });

    it("matches a video for the active track when not previewing", () => {
      const track = discogsTrackFactory.untitled({
        position: "A1",
        duration: "5:50",
      });
      const videos = [
        discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=abc12345678",
          title: "Vedit - Track 1 (Vedit 01)",
          duration: 347,
        }),
      ];
      const playbackMatchIndex = buildReleasePlaybackMatchIndex(
        [track],
        videos,
      );

      expect(
        resolveActivePlaybackVideo({
          previewVideo: null,
          activeTrack: track,
          videos,
          playbackMatchIndex,
        }),
      ).toEqual(videos[0]);
    });
  });

  describe("resolveActiveVideoId", () => {
    it("parses YouTube id from the active video uri", () => {
      const video = discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });

      expect(resolveActiveVideoId(video)).toBe("dQw4w9WgXcQ");
    });

    it("returns null when there is no active video", () => {
      expect(resolveActiveVideoId(null)).toBeNull();
    });
  });
});
