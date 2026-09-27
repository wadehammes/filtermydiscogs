import { describe, expect, it } from "@jest/globals";
import {
  shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery,
  shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden,
} from "src/utils/releasePlaybackHiddenTabTransport";

describe("shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden", () => {
  it("ignores embed pause while hidden during a queue advance transition", () => {
    expect(
      shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden({
        visibilityState: "hidden",
        isWithinTrackSwitchGrace: false,
        isPlaybackVideoUiLoading: true,
        hasPlaybackVideoTransitionTarget: true,
      }),
    ).toBe(true);
  });

  it("ignores embed pause while hidden during track-switch grace", () => {
    expect(
      shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden({
        visibilityState: "hidden",
        isWithinTrackSwitchGrace: true,
        isPlaybackVideoUiLoading: false,
        hasPlaybackVideoTransitionTarget: false,
      }),
    ).toBe(true);
  });

  it("syncs embed pause while hidden when playback is stable", () => {
    expect(
      shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden({
        visibilityState: "hidden",
        isWithinTrackSwitchGrace: false,
        isPlaybackVideoUiLoading: false,
        hasPlaybackVideoTransitionTarget: false,
      }),
    ).toBe(false);
  });
});

describe("shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery", () => {
  it("defers the watchdog until after tab-visible recovery when embed playback is unconfirmed", () => {
    expect(
      shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery({
        visibilityState: "visible",
        isPlaying: true,
        isPaused: false,
        embedPlaybackConfirmed: false,
      }),
    ).toBe(true);
  });

  it("does not defer when embed playback is already confirmed", () => {
    expect(
      shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery({
        visibilityState: "visible",
        isPlaying: true,
        isPaused: false,
        embedPlaybackConfirmed: true,
      }),
    ).toBe(false);
  });
});
