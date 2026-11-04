import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { scheduleIdleWork } from "src/utils/scheduleIdleWork";

describe("scheduleIdleWork", () => {
  const originalRequestIdleCallback = globalThis.requestIdleCallback;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.requestIdleCallback = originalRequestIdleCallback;
  });

  it("when requestIdleCallback exists, runs work on idle", () => {
    const work = jest.fn();
    const idleCallback = jest.fn<(callback: IdleRequestCallback) => number>(
      (callback) => {
        callback({ didTimeout: false, timeRemaining: () => 50 });
        return 1;
      },
    );
    globalThis.requestIdleCallback = idleCallback;

    scheduleIdleWork(work);

    expect(work).toHaveBeenCalledTimes(1);
    expect(idleCallback).toHaveBeenCalledTimes(1);
  });

  it("when requestIdleCallback is unavailable, falls back to setTimeout(0)", () => {
    const work = jest.fn();
    Reflect.deleteProperty(globalThis, "requestIdleCallback");

    scheduleIdleWork(work);

    expect(work).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(work).toHaveBeenCalledTimes(1);

    globalThis.requestIdleCallback = originalRequestIdleCallback;
  });
});
