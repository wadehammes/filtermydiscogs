import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  isPlaybackEmbedWatchdogDebugEnabled,
  logPlaybackEmbedWatchdogDebug,
} from "src/utils/playbackEmbedWatchdogDebug";

describe("playbackEmbedWatchdogDebug", () => {
  const originalInfo = console.info;

  beforeEach(() => {
    console.info = () => {};
  });

  afterEach(() => {
    console.info = originalInfo;
    localStorage.clear();
  });

  it("isPlaybackEmbedWatchdogDebugEnabled is false when the localStorage flag is unset", () => {
    expect(isPlaybackEmbedWatchdogDebugEnabled()).toBe(false);
  });

  it("isPlaybackEmbedWatchdogDebugEnabled is true when localStorage has fmd_debug_playback_embed=1", () => {
    localStorage.setItem("fmd_debug_playback_embed", "1");
    expect(isPlaybackEmbedWatchdogDebugEnabled()).toBe(true);
  });

  it("logPlaybackEmbedWatchdogDebug does nothing when the flag is unset", () => {
    let calls = 0;
    console.info = () => {
      calls += 1;
    };
    logPlaybackEmbedWatchdogDebug("step");
    expect(calls).toBe(0);
  });

  it("logPlaybackEmbedWatchdogDebug calls console.info when the flag is set", () => {
    localStorage.setItem("fmd_debug_playback_embed", "1");
    const seen: unknown[] = [];
    console.info = (...args: unknown[]) => {
      seen.push(...args);
    };
    logPlaybackEmbedWatchdogDebug("watchdog armed", { delayMs: 5000 });
    expect(seen[0]).toBe("[fmd playback embed] watchdog armed");
    expect(seen[1]).toEqual({ delayMs: 5000 });
  });
});
