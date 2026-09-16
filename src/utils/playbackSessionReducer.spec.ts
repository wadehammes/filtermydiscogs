import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  getSessionRelease,
  initialPlaybackSessionState,
  playbackSessionReducer,
  reducePlayQueueItemSession,
  reduceStartReleasePreviewSession,
  resetPlaybackSession,
  selectIsMiniPlayerVisible,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";

describe("playbackSessionReducer", () => {
  const release = releaseFactory.withDisplayDefaults();

  it("starts idle with no release", () => {
    expect(initialPlaybackSessionState.kind).toBe("idle");
    expect(getSessionRelease(initialPlaybackSessionState)).toBeNull();
    expect(selectIsPlaying(initialPlaybackSessionState)).toBe(false);
    expect(selectIsMiniPlayerVisible(initialPlaybackSessionState)).toBe(false);
  });

  it("resetPlaybackSession clears session fields", () => {
    const active = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: false,
      isSameRelease: false,
      pendingTrackPosition: "A1",
      pendingPreviewVideoUri: null,
    });

    const stopped = resetPlaybackSession(active);

    expect(getSessionRelease(stopped)).toBeNull();
    expect(stopped.queue).toEqual([]);
    expect(stopped.playbackHistory).toEqual([]);
    expect(stopped.kind).toBe("idle");
    expect(selectIsPlaying(stopped)).toBe(false);
  });

  it("reducePlayQueueItemSession sets playing transport", () => {
    const next = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: false,
      isSameRelease: false,
      pendingTrackPosition: "A1",
      pendingPreviewVideoUri: null,
    });

    expect(getSessionRelease(next)).toBe(release);
    expect(next.kind).toBe("active");
    expect(next.kind === "active" && next.transport).toBe("playing");
    expect(selectIsPlaying(next)).toBe(true);
    expect(selectIsPaused(next)).toBe(false);
    expect(next.pendingTrackPosition).toBe("A1");
  });

  it("reducePlayQueueItemSession respects startPaused", () => {
    const next = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: true,
      isSameRelease: false,
      pendingTrackPosition: "A1",
      pendingPreviewVideoUri: null,
    });

    expect(next.kind === "active" && next.transport).toBe("paused");
    expect(selectIsPlaying(next)).toBe(true);
    expect(selectIsPaused(next)).toBe(true);
  });

  it("reducePlayQueueItemSession routes preview items to pendingPreviewVideoUri", () => {
    const next = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: false,
      isSameRelease: false,
      pendingTrackPosition: null,
      pendingPreviewVideoUri: "https://www.youtube.com/watch?v=abc",
    });

    expect(next.pendingPreviewVideoUri).toBe(
      "https://www.youtube.com/watch?v=abc",
    );
    expect(next.pendingTrackPosition).toBeNull();
  });

  it("reduceStartReleasePreviewSession seeds preview playback", () => {
    const video = { uri: "https://www.youtube.com/watch?v=abc", title: "Clip" };
    const next = reduceStartReleasePreviewSession(initialPlaybackSessionState, {
      release,
      video,
    });

    expect(getSessionRelease(next)).toBe(release);
    expect(next.previewVideo).toBe(video);
    expect(next.queue).toEqual([]);
    expect(next.kind === "active" && next.transport).toBe("playing");
  });

  it("PAUSE and RESUME toggle transport", () => {
    const playing = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: false,
      isSameRelease: false,
      pendingTrackPosition: "A1",
      pendingPreviewVideoUri: null,
    });

    const paused = playbackSessionReducer(playing, { type: "PAUSE" });
    expect(paused.kind === "active" && paused.transport).toBe("paused");

    const resumed = playbackSessionReducer(paused, { type: "RESUME" });
    expect(resumed.kind === "active" && resumed.transport).toBe("playing");
  });

  it("SET_TRANSPORT_OFF keeps release for inactive dock state", () => {
    const playing = reducePlayQueueItemSession(initialPlaybackSessionState, {
      release,
      startPaused: false,
      isSameRelease: false,
      pendingTrackPosition: null,
      pendingPreviewVideoUri: null,
    });

    const inactive = playbackSessionReducer(playing, {
      type: "SET_TRANSPORT_OFF",
    });

    expect(getSessionRelease(inactive)).toBe(release);
    expect(inactive.kind).toBe("inactive");
    expect(selectIsPlaying(inactive)).toBe(false);
    expect(selectIsMiniPlayerVisible(inactive)).toBe(true);
  });

  it("UPDATE_QUEUE replaces upcoming tracks", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "A1",
    });

    const next = playbackSessionReducer(initialPlaybackSessionState, {
      type: "UPDATE_QUEUE",
      updater: () => [item],
    });

    expect(next.queue).toEqual([item]);
  });

  it("PUSH_HISTORY appends the current item", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "A1",
    });

    const next = playbackSessionReducer(initialPlaybackSessionState, {
      type: "PUSH_HISTORY",
      item,
    });

    expect(next.playbackHistory).toEqual([item]);
  });
});
