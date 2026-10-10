import { describe, expect, it } from "@jest/globals";
import { resolveEmbedUnavailableWatchdogOutcome } from "src/utils/embedUnavailableWatchdogOutcome";

describe("resolveEmbedUnavailableWatchdogOutcome", () => {
  it("defers when embed playback is already confirmed", () => {
    expect(
      resolveEmbedUnavailableWatchdogOutcome({
        embedPlaybackConfirmed: true,
        watchdogVideoId: "abc",
        embedVideoId: "abc",
        isPlaybackVideoUiLoading: true,
        rearmCount: 0,
      }),
    ).toBe("defer");
  });

  it("defers when the watchdog is tracking a different embed video id", () => {
    expect(
      resolveEmbedUnavailableWatchdogOutcome({
        embedPlaybackConfirmed: false,
        watchdogVideoId: "next",
        embedVideoId: "prev",
        isPlaybackVideoUiLoading: true,
        rearmCount: 0,
      }),
    ).toBe("defer");
  });

  it("re-arms once while the target embed is still loading before skipping", () => {
    expect(
      resolveEmbedUnavailableWatchdogOutcome({
        embedPlaybackConfirmed: false,
        watchdogVideoId: "abc",
        embedVideoId: "abc",
        isPlaybackVideoUiLoading: true,
        rearmCount: 0,
      }),
    ).toBe("rearm");

    expect(
      resolveEmbedUnavailableWatchdogOutcome({
        embedPlaybackConfirmed: false,
        watchdogVideoId: "abc",
        embedVideoId: "abc",
        isPlaybackVideoUiLoading: true,
        rearmCount: 1,
      }),
    ).toBe("skip");
  });

  it("skips when the embed is not loading and playback never confirmed", () => {
    expect(
      resolveEmbedUnavailableWatchdogOutcome({
        embedPlaybackConfirmed: false,
        watchdogVideoId: "abc",
        embedVideoId: "abc",
        isPlaybackVideoUiLoading: false,
        rearmCount: 0,
      }),
    ).toBe("skip");
  });
});
