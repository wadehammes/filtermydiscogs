import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { settleProviderEffects } from "src/tests/utils/settleProviderEffects";
import { PLAY_FROM_GESTURE_RETRY_DELAYS_MS } from "src/utils/releasePlayback";

const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

const gestureRetryFlushDelayMs =
  Math.max(...PLAY_FROM_GESTURE_RETRY_DELAYS_MS) + 100;

export const setupPlaybackUser = () =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

export const setupPlaybackSpecTimers = () => {
  jest.useFakeTimers({ advanceTimers: true });
};

export const flushPlaybackGestureRetries = async () => {
  if (jest.isMockFunction(setTimeout)) {
    await act(async () => {
      jest.advanceTimersByTime(gestureRetryFlushDelayMs);
    });
    return;
  }

  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, gestureRetryFlushDelayMs);
    });
  });
};

export const teardownPlaybackSpecTimers = async () => {
  await act(async () => {
    await flushPlaybackGestureRetries();
    await settleProviderEffects();
    if (jest.isMockFunction(setTimeout)) {
      jest.clearAllTimers();
    }
  });
  jest.useRealTimers();
};

export const dispatchYoutubePlayerState = ({
  contentWindow,
  playerState,
  event = "onStateChange",
}: {
  contentWindow: Window;
  playerState: number;
  event?: "onStateChange" | "infoDelivery";
}) => {
  const data =
    event === "infoDelivery"
      ? JSON.stringify({
          event: "infoDelivery",
          info: { playerState },
        })
      : JSON.stringify({ event: "onStateChange", info: playerState });

  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data,
        origin: YOUTUBE_EMBED_ORIGIN,
        source: contentWindow,
      }),
    );
  });
};
