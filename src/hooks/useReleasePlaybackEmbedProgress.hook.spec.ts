import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { PLAYBACK_EMBED_PROGRESS_THROTTLE_MS } from "src/utils/playbackEmbedProgress";
import { useReleasePlaybackEmbedProgress } from "./useReleasePlaybackEmbedProgress.hook";

describe("useReleasePlaybackEmbedProgress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("when infoDelivery advances currentTime, updates throttled embed progress", () => {
    const { result } = renderHook(() => useReleasePlaybackEmbedProgress());

    act(() => {
      result.current.handleInfoDelivery({
        currentTime: 1,
        duration: 120,
        playerState: 1,
      });
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 1,
      duration: 120,
    });

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 1.5, playerState: 1 });
    });

    expect(result.current.embedProgress?.currentTime).toBe(1);

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_PROGRESS_THROTTLE_MS);
      result.current.handleInfoDelivery({ currentTime: 2, playerState: 1 });
    });

    expect(result.current.embedProgress?.currentTime).toBe(2);
  });

  it("when playback resets, snaps embed progress to the track start", () => {
    const { result } = renderHook(() => useReleasePlaybackEmbedProgress());

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 4, duration: 90 });
      result.current.resetEmbedProgress();
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 0,
      duration: 90,
    });
  });

  it("when the track just reset, ignores stale high currentTime from the prior upload", () => {
    const { result } = renderHook(() => useReleasePlaybackEmbedProgress());

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 50, duration: 180 });
      result.current.resetEmbedProgress();
    });

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 48, duration: 180 });
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 0,
      duration: 180,
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_PROGRESS_THROTTLE_MS);
      result.current.handleInfoDelivery({ currentTime: 0.5, duration: 180 });
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 0.5,
      duration: 180,
    });
  });

  it("when transport resumes after a track reset, releaseStaleEmbedProgressGuard accepts the next infoDelivery", () => {
    const { result } = renderHook(() => useReleasePlaybackEmbedProgress());

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 50, duration: 180 });
      result.current.resetEmbedProgress();
    });

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 48, duration: 180 });
    });

    expect(result.current.embedProgress?.currentTime).toBe(0);

    act(() => {
      result.current.releaseStaleEmbedProgressGuard();
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_PROGRESS_THROTTLE_MS);
      result.current.handleInfoDelivery({
        currentTime: 12,
        duration: 180,
        playerState: 1,
      });
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 12,
      duration: 180,
    });
  });

  it("when seeking locally, applies an immediate progress snapshot", () => {
    const { result } = renderHook(() => useReleasePlaybackEmbedProgress());

    act(() => {
      result.current.handleInfoDelivery({ currentTime: 4, duration: 90 });
      result.current.applyLocalSeekSeconds(25);
    });

    expect(result.current.embedProgress).toEqual({
      currentTime: 25,
      duration: 90,
    });
  });
});
