import { describe, expect, it } from "@jest/globals";
import {
  applyPlaybackEmbedProgressGuard,
  clampPlaybackSeekSeconds,
  createPlaybackEmbedProgressGuardForLocalSeek,
  createPlaybackEmbedProgressGuardForTrackReset,
  mergeEmbedProgressFromInfoDelivery,
  resolvePlaybackProgressSliderMax,
  shouldPublishEmbedProgressUpdate,
} from "./playbackEmbedProgress";

describe("clampPlaybackSeekSeconds", () => {
  it("when duration is known, clamps seek inside zero and duration", () => {
    expect(clampPlaybackSeekSeconds({ seconds: 120, duration: 300 })).toBe(120);
    expect(clampPlaybackSeekSeconds({ seconds: -5, duration: 300 })).toBe(0);
    expect(clampPlaybackSeekSeconds({ seconds: 400, duration: 300 })).toBe(300);
  });

  it("when duration is unknown, clamps to a non-negative seek", () => {
    expect(clampPlaybackSeekSeconds({ seconds: 12, duration: null })).toBe(12);
    expect(clampPlaybackSeekSeconds({ seconds: -3, duration: null })).toBe(0);
  });
});

describe("resolvePlaybackProgressSliderMax", () => {
  it("when duration is known, uses duration as slider max", () => {
    expect(
      resolvePlaybackProgressSliderMax({ duration: 240, currentTime: 10 }),
    ).toBe(240);
  });

  it("when duration is unknown, expands max beyond current playback time", () => {
    expect(
      resolvePlaybackProgressSliderMax({ duration: null, currentTime: 45 }),
    ).toBeGreaterThanOrEqual(75);
  });
});

describe("mergeEmbedProgressFromInfoDelivery", () => {
  it("when infoDelivery includes currentTime and duration, merges progress", () => {
    expect(
      mergeEmbedProgressFromInfoDelivery({
        previous: { currentTime: 1, duration: 200 },
        info: { currentTime: 2.5, duration: 201, playerState: 1 },
      }),
    ).toEqual({ currentTime: 2.5, duration: 201 });
  });

  it("when only currentTime updates, keeps prior duration", () => {
    expect(
      mergeEmbedProgressFromInfoDelivery({
        previous: { currentTime: 1, duration: 200 },
        info: { currentTime: 3 },
      }),
    ).toEqual({ currentTime: 3, duration: 200 });
  });

  it("when infoDelivery has no time fields, returns previous progress", () => {
    const previous = { currentTime: 5, duration: 100 };

    expect(
      mergeEmbedProgressFromInfoDelivery({
        previous,
        info: { playerState: 2 },
      }),
    ).toBe(previous);
  });
});

describe("applyPlaybackEmbedProgressGuard", () => {
  it("when the track just changed, ignores stale high currentTime until the window ends", () => {
    const guard = createPlaybackEmbedProgressGuardForTrackReset(1000);

    expect(
      applyPlaybackEmbedProgressGuard({
        progress: { currentTime: 42, duration: 200 },
        guard,
        nowMs: 1100,
      }),
    ).toBeNull();

    expect(
      applyPlaybackEmbedProgressGuard({
        progress: { currentTime: 1.5, duration: 200 },
        guard,
        nowMs: 1100,
      }),
    ).toEqual({ currentTime: 1.5, duration: 200 });
  });

  it("when the listener seeked forward, clamps stale lower currentTime to the local floor", () => {
    const guard = createPlaybackEmbedProgressGuardForLocalSeek(40);

    expect(
      applyPlaybackEmbedProgressGuard({
        progress: { currentTime: 30, duration: 200 },
        guard,
        nowMs: 5000,
      }),
    ).toEqual({ currentTime: 40, duration: 200 });
  });
});

describe("shouldPublishEmbedProgressUpdate", () => {
  it("when the throttle window has elapsed, publishes the next progress tick", () => {
    expect(
      shouldPublishEmbedProgressUpdate({
        lastPublishedAtMs: 1000,
        nowMs: 1300,
        throttleMs: 250,
      }),
    ).toBe(true);
  });

  it("when still inside the throttle window, defers publishing", () => {
    expect(
      shouldPublishEmbedProgressUpdate({
        lastPublishedAtMs: 1000,
        nowMs: 1100,
        throttleMs: 250,
      }),
    ).toBe(false);
  });
});
