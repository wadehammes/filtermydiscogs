import { describe, expect, it } from "@jest/globals";
import {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
  resolveEmbedPlaybackConfirmGateStartedAtMs,
  resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace,
  shouldAcceptEmbedPlayingConfirmation,
  shouldConfirmEmbedPlaybackFromAudibleEmbed,
  shouldConfirmEmbedPlaybackFromWatchdogProgress,
} from "src/utils/releasePlaybackEmbedConfirm";
import { YOUTUBE_PLAYER_STATE_PLAYING } from "src/utils/youtubeIframeEvents";

describe("releasePlaybackEmbedConfirm", () => {
  it("rejects PLAYING confirmation immediately after embed load started", () => {
    const startedAt = 1000;

    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: startedAt,
        nowMs: startedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS - 1,
      }),
    ).toBe(false);
  });

  it("accepts PLAYING confirmation after the post-load delay", () => {
    const startedAt = 1000;

    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: startedAt,
        nowMs: startedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      }),
    ).toBe(true);
  });

  it("rejects PLAYING confirmation when imperative embed load never started", () => {
    expect(
      shouldAcceptEmbedPlayingConfirmation({
        embedLoadStartedAtMs: null,
        nowMs: 5000,
      }),
    ).toBe(false);
  });

  it("when infoDelivery currentTime is advancing, confirms embed playback before watchdog skip", () => {
    expect(
      shouldConfirmEmbedPlaybackFromWatchdogProgress({
        embedPlaybackConfirmed: false,
        lastInfoDeliveryCurrentTime: 1.5,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(true);
  });

  it("when infoDelivery never reported progress, does not confirm from watchdog progress alone", () => {
    expect(
      shouldConfirmEmbedPlaybackFromWatchdogProgress({
        embedPlaybackConfirmed: false,
        lastInfoDeliveryCurrentTime: undefined,
        isPlaying: true,
        isPaused: false,
      }),
    ).toBe(false);
  });

  it("resolveEmbedPlaybackConfirmGateStartedAtMs prefers imperative load over video UI loading cycle", () => {
    expect(
      resolveEmbedPlaybackConfirmGateStartedAtMs({
        imperativeEmbedLoadStartedAtMs: 100,
        videoUiLoadingCycleStartedAtMs: 200,
      }),
    ).toBe(100);
    expect(
      resolveEmbedPlaybackConfirmGateStartedAtMs({
        imperativeEmbedLoadStartedAtMs: null,
        videoUiLoadingCycleStartedAtMs: 200,
      }),
    ).toBe(200);
  });

  it("shouldConfirmEmbedPlaybackFromAudibleEmbed accepts PLAYING after the confirm gate", () => {
    const gateStartedAt = 1000;

    expect(
      shouldConfirmEmbedPlaybackFromAudibleEmbed({
        gateStartedAtMs: gateStartedAt,
        nowMs: gateStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
        playerState: YOUTUBE_PLAYER_STATE_PLAYING,
      }),
    ).toBe(true);
  });

  it("shouldConfirmEmbedPlaybackFromAudibleEmbed accepts advancing currentTime without onStateChange PLAYING", () => {
    const gateStartedAt = 1000;

    expect(
      shouldConfirmEmbedPlaybackFromAudibleEmbed({
        gateStartedAtMs: gateStartedAt,
        nowMs: gateStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
        infoDeliveryCurrentTime: 0.4,
        previousInfoDeliveryCurrentTime: 0.2,
      }),
    ).toBe(true);
  });

  it("shouldConfirmEmbedPlaybackFromAudibleEmbed uses video UI loading cycle when imperative load timestamp is missing", () => {
    const cycleStartedAt = 2000;

    expect(
      shouldConfirmEmbedPlaybackFromAudibleEmbed({
        gateStartedAtMs: cycleStartedAt,
        nowMs: cycleStartedAt + EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
        isPlaying: true,
        isPaused: false,
        lastInfoDeliveryCurrentTime: 2.5,
      }),
    ).toBe(true);
  });

  it("shouldConfirmEmbedPlaybackFromAudibleEmbed confirms from cached progress when confirm gate timestamp is missing", () => {
    expect(
      shouldConfirmEmbedPlaybackFromAudibleEmbed({
        gateStartedAtMs: null,
        nowMs: 9000,
        isPlaying: true,
        isPaused: false,
        lastInfoDeliveryCurrentTime: 3.2,
      }),
    ).toBe(true);
  });

  it("resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace adds grace only while initial presentation is pending", () => {
    expect(
      resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace({
        baseDelayMs: 5000,
        initialPresentationGracePending: true,
      }),
    ).toBe(5000 + PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS);

    expect(
      resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace({
        baseDelayMs: 5000,
        initialPresentationGracePending: false,
      }),
    ).toBe(5000);
  });
});
