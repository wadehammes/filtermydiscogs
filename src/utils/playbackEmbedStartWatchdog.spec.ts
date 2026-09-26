import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  classifyNetworkConnectionQuality,
  createEmbedPlaybackStartWatchdog,
  getNavigatorNetworkInformation,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MOBILE_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MODERATE_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS,
  resolvePlaybackEmbedUnavailableWatchdogMs,
  resolvePlaybackEmbedUnavailableWatchdogMsForQuality,
  shouldArmPlaybackEmbedStartWatchdog,
} from "src/utils/playbackEmbedStartWatchdog";

describe("shouldArmPlaybackEmbedStartWatchdog", () => {
  it("returns false while the document is hidden", () => {
    expect(shouldArmPlaybackEmbedStartWatchdog("hidden")).toBe(false);
  });

  it("returns true while the document is visible", () => {
    expect(shouldArmPlaybackEmbedStartWatchdog("visible")).toBe(true);
  });
});

describe("classifyNetworkConnectionQuality", () => {
  it("treats save-data and 2g effective types as slow", () => {
    expect(
      classifyNetworkConnectionQuality({
        effectiveType: "4g",
        saveData: true,
      }),
    ).toBe("slow");
    expect(classifyNetworkConnectionQuality({ effectiveType: "slow-2g" })).toBe(
      "slow",
    );
    expect(classifyNetworkConnectionQuality({ effectiveType: "2g" })).toBe(
      "slow",
    );
  });

  it("treats 3g and low downlink as moderate", () => {
    expect(classifyNetworkConnectionQuality({ effectiveType: "3g" })).toBe(
      "moderate",
    );
    expect(
      classifyNetworkConnectionQuality({ effectiveType: "4g", downlink: 1 }),
    ).toBe("moderate");
  });

  it("treats 4g and healthy downlink as fast", () => {
    expect(classifyNetworkConnectionQuality({ effectiveType: "4g" })).toBe(
      "fast",
    );
    expect(
      classifyNetworkConnectionQuality({ downlink: 10, effectiveType: "4g" }),
    ).toBe("fast");
  });

  it("returns unknown when the Network Information API is unavailable", () => {
    expect(classifyNetworkConnectionQuality(undefined)).toBe("unknown");
  });

  it("classifies very low downlink as slow even without effectiveType", () => {
    expect(classifyNetworkConnectionQuality({ downlink: 0.2 })).toBe("slow");
  });
});

describe("getNavigatorNetworkInformation", () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("reads connection from standard and vendor-prefixed navigator fields", () => {
    const connection = { effectiveType: "4g" };

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { connection },
    });
    expect(getNavigatorNetworkInformation()).toBe(connection);

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { mozConnection: connection },
    });
    expect(getNavigatorNetworkInformation()).toBe(connection);
  });
});

describe("resolvePlaybackEmbedUnavailableWatchdogMsForQuality", () => {
  it("maps connection quality tiers to watchdog delays", () => {
    expect(
      resolvePlaybackEmbedUnavailableWatchdogMsForQuality("slow", false),
    ).toBe(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS);
    expect(
      resolvePlaybackEmbedUnavailableWatchdogMsForQuality("moderate", false),
    ).toBe(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MODERATE_MS);
    expect(
      resolvePlaybackEmbedUnavailableWatchdogMsForQuality("fast", false),
    ).toBe(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    expect(
      resolvePlaybackEmbedUnavailableWatchdogMsForQuality("unknown", true),
    ).toBe(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MOBILE_MS);
    expect(
      resolvePlaybackEmbedUnavailableWatchdogMsForQuality("unknown", false),
    ).toBe(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
  });
});

describe("resolvePlaybackEmbedUnavailableWatchdogMs", () => {
  const matchMedia = window.matchMedia;
  const navigatorConnection = (navigator as Navigator & { connection?: object })
    .connection;

  afterEach(() => {
    window.matchMedia = matchMedia;
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: navigatorConnection,
    });
  });

  it("uses the slow tier when the Network Information API reports 2g", () => {
    window.matchMedia = jest.fn((query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })) as typeof window.matchMedia;

    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { effectiveType: "2g" },
    });

    expect(resolvePlaybackEmbedUnavailableWatchdogMs()).toBe(
      PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS,
    );
  });

  it("uses the moderate tier when the Network Information API reports 3g", () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { effectiveType: "3g" },
    });

    expect(resolvePlaybackEmbedUnavailableWatchdogMs()).toBe(
      PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MODERATE_MS,
    );
  });

  it("falls back to the mobile delay when connection quality is unknown on coarse pointers", () => {
    window.matchMedia = jest.fn((query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })) as typeof window.matchMedia;

    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: undefined,
    });

    expect(resolvePlaybackEmbedUnavailableWatchdogMs()).toBe(
      PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MOBILE_MS,
    );
  });
});

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
      resolveDelayMs: () => PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
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
      resolveDelayMs: () => PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
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

  it("re-resolves the delay each time it is armed", () => {
    let delayMs = PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS;
    const onTimeout = jest.fn();
    const watchdog = createEmbedPlaybackStartWatchdog({
      resolveDelayMs: () => delayMs,
      schedule: (callback, resolvedDelayMs) =>
        window.setTimeout(callback, resolvedDelayMs),
      cancel: (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    });

    watchdog.arm(onTimeout);
    delayMs = PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS;
    watchdog.arm(onTimeout);

    jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(
      PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS -
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
    );
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
