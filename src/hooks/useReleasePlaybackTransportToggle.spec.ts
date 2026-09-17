import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Dispatch } from "react";
import { useReleasePlaybackTransportToggle } from "src/hooks/useReleasePlaybackTransportToggle.hook";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { renderHook } from "test-utils";

describe("useReleasePlaybackTransportToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resumes transport and schedules gesture unlock retries when paused", () => {
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const schedulePlayFromGestureAttempts = jest.fn();
    const clearPlayFromGestureRetries = jest.fn();
    const awaitingResumeGestureRef = { current: true };
    const pendingPlayFromGestureRef = { current: false };
    const playbackIframeRef = { current: null };

    const { result } = renderHook(() =>
      useReleasePlaybackTransportToggle({
        isPaused: true,
        dispatchSession,
        playbackIframeRef,
        awaitingResumeGestureRef,
        pendingPlayFromGestureRef,
        schedulePlayFromGestureAttempts,
        clearPlayFromGestureRetries,
      }),
    );

    result.current();

    expect(awaitingResumeGestureRef.current).toBe(false);
    expect(pendingPlayFromGestureRef.current).toBe(true);
    expect(schedulePlayFromGestureAttempts).toHaveBeenCalledTimes(1);
    expect(clearPlayFromGestureRetries).not.toHaveBeenCalled();
    expect(dispatchSession).toHaveBeenCalledWith({ type: "RESUME" });
  });

  it("pauses transport and clears gesture retries when playing", () => {
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const schedulePlayFromGestureAttempts = jest.fn();
    const clearPlayFromGestureRetries = jest.fn();
    const pendingPlayFromGestureRef = { current: true };

    const { result } = renderHook(() =>
      useReleasePlaybackTransportToggle({
        isPaused: false,
        dispatchSession,
        playbackIframeRef: { current: null },
        awaitingResumeGestureRef: { current: false },
        pendingPlayFromGestureRef,
        schedulePlayFromGestureAttempts,
        clearPlayFromGestureRetries,
      }),
    );

    result.current();

    expect(pendingPlayFromGestureRef.current).toBe(false);
    expect(clearPlayFromGestureRetries).toHaveBeenCalledTimes(1);
    expect(schedulePlayFromGestureAttempts).not.toHaveBeenCalled();
    expect(dispatchSession).toHaveBeenCalledWith({ type: "PAUSE" });
  });
});
