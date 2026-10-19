import { describe, expect, it } from "@jest/globals";
import {
  initialPlaybackEmbedSessionState,
  reducePlaybackEmbedSession,
  selectShouldAttemptPlayFromGestureDuringHiddenPoll,
  selectShouldRunHiddenTabPlayerStatePoll,
  selectShouldRunVisibleTabAudibleSyncPoll,
} from "src/utils/playbackEmbedSession";

describe("playbackEmbedSession", () => {
  it("runs hidden-tab player-state poll while transport session is active, including when transport is paused", () => {
    expect(
      selectShouldRunHiddenTabPlayerStatePoll({
        transportSessionActive: true,
        documentHidden: true,
        transportPaused: true,
        withinTrackSwitchGrace: false,
      }),
    ).toBe(true);

    expect(
      selectShouldRunHiddenTabPlayerStatePoll({
        transportSessionActive: true,
        documentHidden: true,
        transportPaused: false,
        withinTrackSwitchGrace: false,
      }),
    ).toBe(true);
  });

  it("does not run hidden-tab poll when transport session is inactive", () => {
    expect(
      selectShouldRunHiddenTabPlayerStatePoll({
        transportSessionActive: false,
        documentHidden: true,
        transportPaused: false,
        withinTrackSwitchGrace: false,
      }),
    ).toBe(false);
  });

  it("retries playVideo from hidden poll only during track-switch grace while transport is playing", () => {
    expect(
      selectShouldAttemptPlayFromGestureDuringHiddenPoll({
        transportSessionActive: true,
        documentHidden: true,
        transportPaused: false,
        withinTrackSwitchGrace: true,
      }),
    ).toBe(true);

    expect(
      selectShouldAttemptPlayFromGestureDuringHiddenPoll({
        transportSessionActive: true,
        documentHidden: true,
        transportPaused: true,
        withinTrackSwitchGrace: true,
      }),
    ).toBe(false);

    expect(
      selectShouldAttemptPlayFromGestureDuringHiddenPoll({
        transportSessionActive: true,
        documentHidden: false,
        transportPaused: false,
        withinTrackSwitchGrace: true,
      }),
    ).toBe(false);
  });

  it("polls audible embed sync on a visible tab while video UI loading and transport is playing", () => {
    expect(
      selectShouldRunVisibleTabAudibleSyncPoll({
        transportSessionActive: true,
        transportPaused: false,
        videoUiLoading: true,
        embedConfirmed: false,
        documentHidden: false,
      }),
    ).toBe(true);

    expect(
      selectShouldRunVisibleTabAudibleSyncPoll({
        transportSessionActive: true,
        transportPaused: true,
        videoUiLoading: true,
        embedConfirmed: false,
        documentHidden: false,
      }),
    ).toBe(false);

    expect(
      selectShouldRunVisibleTabAudibleSyncPoll({
        transportSessionActive: true,
        transportPaused: false,
        videoUiLoading: false,
        embedConfirmed: false,
        documentHidden: false,
      }),
    ).toBe(false);

    expect(
      selectShouldRunVisibleTabAudibleSyncPoll({
        transportSessionActive: true,
        transportPaused: false,
        videoUiLoading: true,
        embedConfirmed: true,
        documentHidden: false,
      }),
    ).toBe(false);
  });

  it("resets confirmation when a new embed load starts for a different video id", () => {
    const afterFirstLoad = reducePlaybackEmbedSession(
      {
        ...initialPlaybackEmbedSessionState,
        loadVideoId: "video-a",
        embedConfirmed: true,
        loadGeneration: 1,
      },
      { type: "embed/load/started", videoId: "video-b", nowMs: 1000 },
    );

    expect(afterFirstLoad.loadVideoId).toBe("video-b");
    expect(afterFirstLoad.embedConfirmed).toBe(false);
    expect(afterFirstLoad.loadGeneration).toBe(2);
    expect(afterFirstLoad.loadStartedAtMs).toBe(1000);
  });

  it("marks embed confirmed for the active load video id", () => {
    const loading = reducePlaybackEmbedSession(
      initialPlaybackEmbedSessionState,
      {
        type: "embed/load/started",
        videoId: "video-a",
        nowMs: 500,
      },
    );

    const confirmed = reducePlaybackEmbedSession(loading, {
      type: "embed/load/confirmed",
      videoId: "video-a",
    });

    expect(confirmed.embedConfirmed).toBe(true);
    expect(confirmed.loadVideoId).toBe("video-a");
  });

  it("ignores confirm for a stale video id after load generation moved on", () => {
    const loading = reducePlaybackEmbedSession(
      initialPlaybackEmbedSessionState,
      {
        type: "embed/load/started",
        videoId: "video-a",
        nowMs: 500,
      },
    );

    const switched = reducePlaybackEmbedSession(loading, {
      type: "embed/load/started",
      videoId: "video-b",
      nowMs: 600,
    });

    const staleConfirm = reducePlaybackEmbedSession(switched, {
      type: "embed/load/confirmed",
      videoId: "video-a",
    });

    expect(staleConfirm.embedConfirmed).toBe(false);
    expect(staleConfirm.loadVideoId).toBe("video-b");
  });
});
