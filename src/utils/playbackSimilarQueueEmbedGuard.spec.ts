import { describe, expect, it } from "@jest/globals";
import {
  shouldHoldConfirmedEmbedDuringSimilarQueueFetch,
  shouldIgnoreConfirmedEmbedLoadStarted,
  shouldRearmEmbedWatchdogAfterSimilarQueueFetchEnd,
  shouldSuppressEmbedLoadStartedDuringSimilarQueueFetch,
} from "src/utils/playbackSimilarQueueEmbedGuard";

describe("playbackSimilarQueueEmbedGuard", () => {
  it("holds confirmed embed transport only while similar queue fetch is in flight", () => {
    expect(
      shouldHoldConfirmedEmbedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: true,
        embedPlaybackConfirmed: true,
      }),
    ).toBe(true);

    expect(
      shouldHoldConfirmedEmbedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: false,
        embedPlaybackConfirmed: true,
      }),
    ).toBe(false);

    expect(
      shouldHoldConfirmedEmbedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: true,
        embedPlaybackConfirmed: false,
      }),
    ).toBe(false);
  });

  it("does not suppress load started when watchdog or resolved video id is missing", () => {
    expect(
      shouldSuppressEmbedLoadStartedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: true,
        embedPlaybackConfirmed: true,
        resolvedVideoId: null,
        watchdogVideoId: "currentVideo1",
      }),
    ).toBe(false);
  });

  it("suppresses spurious embed load started for a different video during similar queue fetch", () => {
    expect(
      shouldSuppressEmbedLoadStartedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: true,
        embedPlaybackConfirmed: true,
        resolvedVideoId: "nextVideo1234",
        watchdogVideoId: "currentVideo1",
      }),
    ).toBe(true);

    expect(
      shouldSuppressEmbedLoadStartedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: true,
        embedPlaybackConfirmed: true,
        resolvedVideoId: "currentVideo1",
        watchdogVideoId: "currentVideo1",
      }),
    ).toBe(false);
  });

  it("does not re-arm the embed watchdog after similar fetch when UI loading or confirmed", () => {
    expect(
      shouldRearmEmbedWatchdogAfterSimilarQueueFetchEnd({
        embedPlaybackConfirmed: true,
        isPaused: false,
        isPlaying: true,
        isPlaybackVideoUiLoading: false,
        videoId: "abc12345678",
      }),
    ).toBe(false);

    expect(
      shouldRearmEmbedWatchdogAfterSimilarQueueFetchEnd({
        embedPlaybackConfirmed: false,
        isPaused: false,
        isPlaying: true,
        isPlaybackVideoUiLoading: true,
        videoId: "abc12345678",
      }),
    ).toBe(false);

    expect(
      shouldRearmEmbedWatchdogAfterSimilarQueueFetchEnd({
        embedPlaybackConfirmed: false,
        isPaused: false,
        isPlaying: true,
        isPlaybackVideoUiLoading: false,
        videoId: "abc12345678",
      }),
    ).toBe(true);
  });

  it("ignores duplicate load started for the confirmed watchdog video id", () => {
    expect(
      shouldIgnoreConfirmedEmbedLoadStarted({
        embedPlaybackConfirmed: true,
        resolvedVideoId: "currentVideo1",
        watchdogVideoId: "currentVideo1",
      }),
    ).toBe(true);

    expect(
      shouldIgnoreConfirmedEmbedLoadStarted({
        embedPlaybackConfirmed: false,
        resolvedVideoId: "currentVideo1",
        watchdogVideoId: "currentVideo1",
      }),
    ).toBe(false);
  });
});
