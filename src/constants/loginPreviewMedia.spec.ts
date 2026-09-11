import { describe, expect, it, jest } from "@jest/globals";
import {
  LOGIN_PREVIEW_VIDEO_ASPECT_RATIO,
  LOGIN_PREVIEW_VIDEO_HEIGHT,
  LOGIN_PREVIEW_VIDEO_WIDTH,
  LOGIN_PREVIEW_YOUTUBE_PLAYBACK_QUALITY,
  LOGIN_PREVIEW_YOUTUBE_PLAYER_CONFIG,
  requestLoginPreviewHd1080,
} from "src/constants/loginPreviewMedia";

describe("loginPreviewMedia", () => {
  it("requests hd1080 from the YouTube iframe API when available", () => {
    const setPlaybackQuality = jest.fn();

    requestLoginPreviewHd1080({
      api: { setPlaybackQuality },
    } as unknown as HTMLElement);

    expect(setPlaybackQuality).toHaveBeenCalledWith(
      LOGIN_PREVIEW_YOUTUBE_PLAYBACK_QUALITY,
    );
  });

  it("includes the vq embed hint for 1080p", () => {
    expect(LOGIN_PREVIEW_YOUTUBE_PLAYER_CONFIG.vq).toBe("hd1080");
  });

  it("uses the native walkthrough dimensions for the oversampled iframe", () => {
    expect(LOGIN_PREVIEW_VIDEO_ASPECT_RATIO).toBe("1680 / 1080");
    expect(LOGIN_PREVIEW_VIDEO_WIDTH).toBe(1680);
    expect(LOGIN_PREVIEW_VIDEO_HEIGHT).toBe(1080);
  });
});
