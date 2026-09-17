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
  resolveNeedsPlaybackVideoSwitch,
  resolvePlaybackVideoId,
  shouldClearPlaybackVideoTransition,
} from "src/utils/releasePlaybackActivePresentation";

describe("releasePlaybackActivePresentation", () => {
  it("resolveIsPlaybackReady is ready when transport is active and a playback video id is resolved", () => {
    expect(
      resolveIsPlaybackReady({
        isPlaying: true,
        playbackVideoId: "abc12345678",
      }),
    ).toBe(true);
  });

  it("resolveIsPlaybackReady is not ready without transport or a resolved playback video id", () => {
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

  it("resolvePlaybackVideoId uses the transition target while queue advance is settling", () => {
    expect(
      resolvePlaybackVideoId({
        transitionTargetVideoId: "abc12345678",
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
        embedVideoId: "abc12345678",
        activeVideoId: "te2jJncBVG4",
      }),
    ).toBe("abc12345678");
  });

  it("resolveNeedsPlaybackVideoSwitch is true when the prepared upload differs from the active upload", () => {
    expect(
      resolveNeedsPlaybackVideoSwitch({
        preparedEmbedVideoId: "abc12345678",
        activeVideoId: "te2jJncBVG4",
      }),
    ).toBe(true);
    expect(
      resolveNeedsPlaybackVideoSwitch({
        preparedEmbedVideoId: "abc12345678",
        activeVideoId: "abc12345678",
      }),
    ).toBe(false);
    expect(
      resolveNeedsPlaybackVideoSwitch({
        preparedEmbedVideoId: "abc12345678",
        activeVideoId: null,
      }),
    ).toBe(true);
  });

  it("shouldClearPlaybackVideoTransition clears when active video matches the target and nothing is pending", () => {
    expect(
      shouldClearPlaybackVideoTransition({
        transitionTargetVideoId: "abc12345678",
        activeVideoId: "abc12345678",
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
      }),
    ).toBe(true);
    expect(
      shouldClearPlaybackVideoTransition({
        transitionTargetVideoId: "abc12345678",
        activeVideoId: "te2jJncBVG4",
        pendingTrackPosition: "B1",
        pendingPreviewVideoUri: null,
      }),
    ).toBe(false);
  });

  it("resolvePlaybackVideoId prefers the embed override while a pending track is resolving", () => {
    expect(
      resolvePlaybackVideoId({
        pendingTrackPosition: "A1",
        pendingPreviewVideoUri: null,
        embedVideoId: "embed-id",
        activeVideoId: "active-id",
      }),
    ).toBe("embed-id");
  });

  it("resolvePlaybackVideoId falls back to the active track video when idle", () => {
    expect(
      resolvePlaybackVideoId({
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
        embedVideoId: null,
        activeVideoId: "active-id",
      }),
    ).toBe("active-id");
  });

  it("resolvePlaybackVideoId uses active track video id when idle and falls back to embed when active is missing", () => {
    expect(
      resolvePlaybackVideoId({
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
        embedVideoId: "abc12345678",
        activeVideoId: "abc12345678",
      }),
    ).toBe("abc12345678");
    expect(
      resolvePlaybackVideoId({
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
        embedVideoId: "embed-fallback-id",
        activeVideoId: null,
      }),
    ).toBe("embed-fallback-id");
  });

  it("resolveActivePlaybackTitle uses preview video title during release preview playback", () => {
    expect(
      resolveActivePlaybackTitle({
        isReleasePreview: true,
        previewTitle: "Full album",
        trackTitle: "Track one",
      }),
    ).toBe("Full album");
  });

  it("resolveActiveTrackPosition hides track position during preview playback", () => {
    expect(
      resolveActiveTrackPosition({
        isReleasePreview: true,
        trackPosition: "A1",
      }),
    ).toBeNull();
  });

  it("resolveActivePlaybackVideo prefers preview video over track matches", () => {
    const preview = discogsVideoFactory.build({ title: "Preview" });
    const track = discogsTrackFactory.build({
      position: "A1",
      title: "Track",
    });
    const videos = [discogsVideoFactory.build()];
    const playbackMatchIndex = buildReleasePlaybackMatchIndex([track], videos);

    expect(
      resolveActivePlaybackVideo({
        previewVideo: preview,
        activeTrack: track,
        videos,
        playbackMatchIndex,
      }),
    ).toBe(preview);
  });

  it("resolveActivePlaybackVideo matches a video for the active track when not previewing", () => {
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
    const playbackMatchIndex = buildReleasePlaybackMatchIndex([track], videos);

    expect(
      resolveActivePlaybackVideo({
        previewVideo: null,
        activeTrack: track,
        videos,
        playbackMatchIndex,
      }),
    ).toEqual(videos[0]);
  });

  it("resolveActiveVideoId parses YouTube id from the active video uri", () => {
    const video = discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    expect(resolveActiveVideoId(video)).toBe("dQw4w9WgXcQ");
  });

  it("resolveActiveVideoId returns null when there is no active video", () => {
    expect(resolveActiveVideoId(null)).toBeNull();
  });
});
