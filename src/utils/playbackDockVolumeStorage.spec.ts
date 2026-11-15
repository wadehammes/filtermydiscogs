import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearPlaybackDockVolume,
  DEFAULT_PLAYBACK_DOCK_VOLUME,
  readPlaybackDockVolume,
  writePlaybackDockVolume,
} from "./playbackDockVolumeStorage";

describe("playbackDockVolumeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("when storage is empty, reads the default dock volume", () => {
    expect(readPlaybackDockVolume()).toBe(DEFAULT_PLAYBACK_DOCK_VOLUME);
  });

  it("when volume is stored, reads and clamps values into 0 through 100", () => {
    writePlaybackDockVolume(42);
    expect(readPlaybackDockVolume()).toBe(42);

    writePlaybackDockVolume(120);
    expect(readPlaybackDockVolume()).toBe(100);

    writePlaybackDockVolume(-10);
    expect(readPlaybackDockVolume()).toBe(0);
  });

  it("when cleared, falls back to the default volume", () => {
    writePlaybackDockVolume(55);
    clearPlaybackDockVolume();
    expect(readPlaybackDockVolume()).toBe(DEFAULT_PLAYBACK_DOCK_VOLUME);
  });
});
