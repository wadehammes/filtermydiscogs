import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  initialPlaybackSessionState,
  playbackSessionReducer,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";
import { syncPlaybackSessionRefs } from "src/utils/syncPlaybackSessionRefs";

describe("syncPlaybackSessionRefs", () => {
  const release = releaseFactory.withDisplayDefaults();

  it("mirrors session fields and derived transport flags into refs in one pass", () => {
    const session = playbackSessionReducer(initialPlaybackSessionState, {
      type: "PLAY_QUEUE_ITEM",
      params: {
        release,
        startPaused: true,
        isSameRelease: false,
        pendingTrackPosition: "A1",
        pendingPreviewVideoUri: null,
      },
    });

    const releaseRef = { current: null as DiscogsRelease | null };
    const queueRef = { current: [] as PlaybackQueueItem[] };
    const playbackHistoryRef = { current: [] as PlaybackQueueItem[] };
    const activeTrackIndexRef = { current: -1 };
    const previewVideoRef = { current: null as DiscogsVideo | null };
    const isPlayingRef = { current: false };
    const isPausedRef = { current: false };

    syncPlaybackSessionRefs(session, {
      release: releaseRef,
      queue: queueRef,
      playbackHistory: playbackHistoryRef,
      activeTrackIndex: activeTrackIndexRef,
      previewVideo: previewVideoRef,
      isPlaying: isPlayingRef,
      isPaused: isPausedRef,
    });

    expect(releaseRef.current).toBe(release);
    expect(queueRef.current).toBe(session.queue);
    expect(playbackHistoryRef.current).toBe(session.playbackHistory);
    expect(activeTrackIndexRef.current).toBe(session.activeTrackIndex);
    expect(previewVideoRef.current).toBe(session.previewVideo);
    expect(isPlayingRef.current).toBe(selectIsPlaying(session));
    expect(isPausedRef.current).toBe(selectIsPaused(session));
  });
});
