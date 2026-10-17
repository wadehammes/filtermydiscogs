import { describe, expect, it } from "@jest/globals";
import { initialPlaybackEmbedSessionState } from "src/utils/playbackEmbedSession";
import { syncPlaybackEmbedSessionRefs } from "src/utils/syncPlaybackEmbedSessionRefs";

describe("syncPlaybackEmbedSessionRefs", () => {
  it("mirrors embed session fields onto legacy playback refs", () => {
    const embedPlaybackConfirmed = { current: false };
    const isPlaybackVideoUiLoading = { current: false };
    const playbackVideoUiLoadingEmbedLoadStartedAtMs = { current: null };
    const playbackVideoUiLoadingCycleStartedAtMs = { current: null };
    const playbackVideoUiLoadingTargetVideoId = { current: null };

    syncPlaybackEmbedSessionRefs(
      {
        ...initialPlaybackEmbedSessionState,
        embedConfirmed: true,
        videoUiLoading: true,
        imperativeLoadStartedAtMs: 100,
        videoUiLoadingCycleStartedAtMs: 200,
        loadingTargetVideoId: "video-1",
      },
      {
        embedPlaybackConfirmed,
        isPlaybackVideoUiLoading,
        playbackVideoUiLoadingEmbedLoadStartedAtMs,
        playbackVideoUiLoadingCycleStartedAtMs,
        playbackVideoUiLoadingTargetVideoId,
      },
    );

    expect(embedPlaybackConfirmed.current).toBe(true);
    expect(isPlaybackVideoUiLoading.current).toBe(true);
    expect(playbackVideoUiLoadingEmbedLoadStartedAtMs.current).toBe(100);
    expect(playbackVideoUiLoadingCycleStartedAtMs.current).toBe(200);
    expect(playbackVideoUiLoadingTargetVideoId.current).toBe("video-1");
  });
});
