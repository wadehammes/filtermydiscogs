import { describe, expect, it } from "@jest/globals";
import { applyPlaybackEmbedSessionEvent } from "src/utils/applyPlaybackEmbedSessionEvent";
import { initialPlaybackEmbedSessionState } from "src/utils/playbackEmbedSession";

describe("applyPlaybackEmbedSessionEvent", () => {
  it("reduces embed session state and syncs legacy refs", () => {
    const sessionRef = { current: initialPlaybackEmbedSessionState };
    const embedPlaybackConfirmed = { current: false };
    const isPlaybackVideoUiLoading = { current: false };
    const playbackVideoUiLoadingEmbedLoadStartedAtMs = { current: null };
    const playbackVideoUiLoadingCycleStartedAtMs = { current: null };
    const playbackVideoUiLoadingTargetVideoId = { current: null };

    applyPlaybackEmbedSessionEvent(
      sessionRef,
      { type: "embed/ui-loading/began", nowMs: 500 },
      {
        embedPlaybackConfirmed,
        isPlaybackVideoUiLoading,
        playbackVideoUiLoadingEmbedLoadStartedAtMs,
        playbackVideoUiLoadingCycleStartedAtMs,
        playbackVideoUiLoadingTargetVideoId,
      },
    );

    expect(sessionRef.current.videoUiLoading).toBe(true);
    expect(isPlaybackVideoUiLoading.current).toBe(true);
    expect(playbackVideoUiLoadingCycleStartedAtMs.current).toBe(500);
  });
});
