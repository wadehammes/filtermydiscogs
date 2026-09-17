import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { useRef } from "react";
import { useReleasePlaybackPlayFromGesture } from "src/hooks/useReleasePlaybackPlayFromGesture.hook";
import { postYoutubePlayerCommand } from "src/utils/postYoutubePlayerCommand";
import { renderHook } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
}));

const mockPostYoutubePlayerCommand = jest.mocked(postYoutubePlayerCommand);

describe("useReleasePlaybackPlayFromGesture", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retries playVideo while a gesture unlock is pending", () => {
    const pendingPlayFromGestureRef = { current: true };
    const isPausedRef = { current: false };
    const playbackIframeRef = { current: null };
    const playFromGestureRetryTimeoutsRef = { current: [] as number[] };

    const { result } = renderHook(() =>
      useReleasePlaybackPlayFromGesture({
        isPausedRef,
        pendingPlayFromGestureRef,
        playbackIframeRef,
        playFromGestureRetryTimeoutsRef,
      }),
    );

    result.current.schedulePlayFromGestureAttempts();

    expect(mockPostYoutubePlayerCommand).toHaveBeenCalledTimes(1);

    jest.runAllTimers();

    expect(mockPostYoutubePlayerCommand.mock.calls.length).toBeGreaterThan(1);
  });

  it("clears scheduled retries", () => {
    const playFromGestureRetryTimeoutsRef = { current: [] as number[] };

    const { result } = renderHook(() => {
      const pendingPlayFromGestureRef = useRef(true);
      const isPausedRef = useRef(false);
      const playbackIframeRef = useRef<HTMLIFrameElement | null>(null);

      return useReleasePlaybackPlayFromGesture({
        isPausedRef,
        pendingPlayFromGestureRef,
        playbackIframeRef,
        playFromGestureRetryTimeoutsRef,
      });
    });

    result.current.schedulePlayFromGestureAttempts();
    result.current.clearPlayFromGestureRetries();

    jest.runAllTimers();

    expect(mockPostYoutubePlayerCommand).toHaveBeenCalledTimes(1);
  });
});
