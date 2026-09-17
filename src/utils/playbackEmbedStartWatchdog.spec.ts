import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { createEmbedPlaybackStartWatchdog } from "src/utils/playbackEmbedStartWatchdog";

describe("createEmbedPlaybackStartWatchdog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs the timeout callback after the configured delay", () => {
    const onTimeout = jest.fn();
    const watchdog = createEmbedPlaybackStartWatchdog({
      delayMs: 5000,
      schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
      cancel: (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    });

    watchdog.arm(onTimeout);

    jest.advanceTimersByTime(4999);
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("disarm clears a pending timeout", () => {
    const onTimeout = jest.fn();
    const watchdog = createEmbedPlaybackStartWatchdog({
      delayMs: 5000,
      schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
      cancel: (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    });

    watchdog.arm(onTimeout);
    watchdog.disarm();

    jest.advanceTimersByTime(5000);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
