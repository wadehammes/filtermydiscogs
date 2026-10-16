import { describe, expect, it } from "@jest/globals";
import { shouldConfirmEmbedPlaybackFromInfoDelivery } from "src/utils/embedPlaybackInfoDeliveryConfirm";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { YOUTUBE_PLAYER_STATE_PLAYING } from "src/utils/youtubeIframeEvents";

describe("shouldConfirmEmbedPlaybackFromInfoDelivery", () => {
  const loadStartedAt = 1_000;

  it("when transport is paused, does not confirm", () => {
    expect(
      shouldConfirmEmbedPlaybackFromInfoDelivery({
        info: { currentTime: 3, playerState: YOUTUBE_PLAYER_STATE_PLAYING },
        embedLoadStartedAtMs: loadStartedAt,
        nowMs: loadStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: true,
      }),
    ).toBe(false);
  });

  it("when infoDelivery reports PLAYING after the confirm delay, confirms", () => {
    expect(
      shouldConfirmEmbedPlaybackFromInfoDelivery({
        info: { playerState: YOUTUBE_PLAYER_STATE_PLAYING },
        embedLoadStartedAtMs: loadStartedAt,
        nowMs: loadStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(true);
  });

  it("when infoDelivery only advances currentTime without onStateChange PLAYING, confirms", () => {
    expect(
      shouldConfirmEmbedPlaybackFromInfoDelivery({
        info: { currentTime: 0.25 },
        previousCurrentTime: 0,
        embedLoadStartedAtMs: loadStartedAt,
        nowMs: loadStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(true);
  });

  it("when embed load just started, waits for the confirm delay", () => {
    expect(
      shouldConfirmEmbedPlaybackFromInfoDelivery({
        info: { currentTime: 1 },
        embedLoadStartedAtMs: loadStartedAt,
        nowMs: loadStartedAt + 50,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(false);
  });

  it("when only the video UI loading cycle started, confirms from infoDelivery after the gate", () => {
    const cycleStartedAt = 5_000;

    expect(
      shouldConfirmEmbedPlaybackFromInfoDelivery({
        info: { currentTime: 1.2 },
        embedLoadStartedAtMs: null,
        videoUiLoadingCycleStartedAtMs: cycleStartedAt,
        nowMs: cycleStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(true);
  });
});
