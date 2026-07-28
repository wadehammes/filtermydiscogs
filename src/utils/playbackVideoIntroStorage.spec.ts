import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearPlaybackVideoIntroSeen,
  hasSeenPlaybackVideoIntro,
  markPlaybackVideoIntroSeen,
  PLAYBACK_VIDEO_INTRO_STORAGE_KEY,
} from "./playbackVideoIntroStorage";

describe("playbackVideoIntroStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false until the dock video intro has been marked seen", () => {
    expect(hasSeenPlaybackVideoIntro()).toBe(false);

    markPlaybackVideoIntroSeen();

    expect(hasSeenPlaybackVideoIntro()).toBe(true);
    expect(localStorage.getItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY)).toBe("true");
  });

  it("clears the intro flag", () => {
    markPlaybackVideoIntroSeen();

    clearPlaybackVideoIntroSeen();

    expect(hasSeenPlaybackVideoIntro()).toBe(false);
  });
});
