import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Dispatch } from "react";
import { useReleasePlaybackPendingResolution } from "src/hooks/useReleasePlaybackPendingResolution.hook";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { renderHook } from "test-utils";

const RELEASE_ID = 42;

describe("useReleasePlaybackPendingResolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const buildHarness = (
    overrides: Partial<
      Parameters<typeof useReleasePlaybackPendingResolution>[0]
    > = {},
  ) => {
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const abortUnresolvedPlayback = jest.fn();
    const setUpcomingQueue = jest.fn();
    const maybeExtendQueueTail = jest.fn();
    const appendSimilarReleasesToQueue = jest.fn(async () => true);
    const awaitingResumeGestureRef = { current: false };
    const shouldRebuildAlbumQueueRef = { current: false };
    const similarQueueGenerationRef = { current: 0 };
    const similarQueueModeRef = {
      current: { enabled: false, initialAppendPending: false },
    };
    const track = discogsTrackFactory.build({ position: "A1", type_: "track" });

    const defaults: Parameters<typeof useReleasePlaybackPendingResolution>[0] =
      {
        abortUnresolvedPlayback,
        activeTrackIndex: 0,
        activeVideoId: null,
        appendSimilarReleasesToQueue,
        awaitingResumeGestureRef,
        dispatchSession,
        embedVideoId: null,
        isLoading: false,
        isPlaying: true,
        isReleasePreview: false,
        maybeExtendQueueTail,
        pendingPreviewVideoUri: null,
        pendingTrackPosition: null,
        previewVideo: null,
        release: releaseFactory.withDisplayDefaults({ id: RELEASE_ID }),
        releaseDetailId: RELEASE_ID,
        releaseId: RELEASE_ID,
        setUpcomingQueue,
        shouldRebuildAlbumQueueRef,
        similarQueueGenerationRef,
        similarQueueModeRef,
        tracks: [track],
        videos: [],
      };

    const params = { ...defaults, ...overrides };

    renderHook(() => useReleasePlaybackPendingResolution(params));

    return {
      abortUnresolvedPlayback,
      appendSimilarReleasesToQueue,
      awaitingResumeGestureRef,
      dispatchSession,
      maybeExtendQueueTail,
      params,
      setUpcomingQueue,
      shouldRebuildAlbumQueueRef,
      similarQueueModeRef,
    };
  };

  it("extends the queue tail while album playback is active", () => {
    const { maybeExtendQueueTail } = buildHarness({
      isPlaying: true,
      previewVideo: null,
    });

    expect(maybeExtendQueueTail).toHaveBeenCalledTimes(1);
  });

  it("resolves a pending track position once release detail is synced", () => {
    const { dispatchSession, awaitingResumeGestureRef } = buildHarness({
      pendingTrackPosition: "A1",
    });

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "RESOLVE_PENDING_TRACK",
      index: 0,
      resumeTransport: true,
    });
    expect(awaitingResumeGestureRef.current).toBe(false);
  });

  it("aborts playback when the pending track position is missing from the tracklist", () => {
    const { abortUnresolvedPlayback, dispatchSession } = buildHarness({
      pendingTrackPosition: "Z9",
    });

    expect(abortUnresolvedPlayback).toHaveBeenCalledTimes(1);
    expect(dispatchSession).not.toHaveBeenCalled();
  });

  it("resolves a pending preview video uri", () => {
    const video = discogsVideoFactory.build({
      uri: "https://youtube.com/watch?v=preview123",
    });

    const { dispatchSession } = buildHarness({
      pendingPreviewVideoUri: video.uri,
      videos: [video],
    });

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "RESOLVE_PREVIEW_VIDEO",
      video,
    });
  });

  it("aborts when the pending preview uri does not match release videos", () => {
    const otherVideo = discogsVideoFactory.build({
      uri: "https://youtube.com/watch?v=other",
    });

    const { abortUnresolvedPlayback } = buildHarness({
      pendingPreviewVideoUri: "https://youtube.com/watch?v=missing",
      videos: [otherVideo],
    });

    expect(abortUnresolvedPlayback).toHaveBeenCalledTimes(1);
  });

  it("clears transport and persisted session when album playback has no youtube match", () => {
    writePersistedReleasePlayback({
      instanceId: "1",
      trackPosition: "A1",
    });

    const { dispatchSession } = buildHarness({
      isPlaying: true,
      isLoading: false,
      pendingTrackPosition: null,
      pendingPreviewVideoUri: null,
      activeVideoId: null,
      embedVideoId: null,
    });

    expect(dispatchSession).toHaveBeenCalledWith({ type: "SET_TRANSPORT_OFF" });
    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("resets an out-of-range active track index when nothing is pending", () => {
    const { dispatchSession } = buildHarness({
      activeTrackIndex: 5,
      pendingTrackPosition: null,
      tracks: discogsTrackFactory.buildList(2, { type_: "track" }),
    });

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "SET_ACTIVE_TRACK_INDEX",
      index: 0,
    });
    expect(dispatchSession).toHaveBeenCalledWith({ type: "RESUME" });
  });
});
