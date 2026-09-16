import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  getPlaybackSessionPhase,
  initialPlaybackSessionState,
  type PlaybackSessionAction,
  type PlaybackSessionState,
  playbackSessionReducer,
  validatePlaybackSessionState,
} from "src/utils/playbackSessionState";

describe("playbackSessionInvariants", () => {
  const release = releaseFactory.withDisplayDefaults();

  it("rejects active transport when release is missing", () => {
    const broken = {
      kind: "active",
      release: null,
      transport: "playing",
      queue: [],
      playbackHistory: [],
      activeTrackIndex: 0,
      previewVideo: null,
      pendingTrackPosition: null,
      pendingPreviewVideoUri: null,
    };

    expect(validatePlaybackSessionState(broken)).toEqual({
      ok: false,
      reason: "active session requires a release",
    });
  });

  it("rejects idle session that still carries a release", () => {
    const invalid = {
      kind: "idle",
      queue: [],
      playbackHistory: [],
      activeTrackIndex: 0,
      previewVideo: null,
      pendingTrackPosition: null,
      pendingPreviewVideoUri: null,
      release,
    };

    expect(validatePlaybackSessionState(invalid)).toEqual({
      ok: false,
      reason: "idle session must not carry a release",
    });
  });

  it("classifies inactive dock separately from idle", () => {
    const playing = playbackSessionReducer(initialPlaybackSessionState, {
      type: "PLAY_QUEUE_ITEM",
      params: {
        release,
        startPaused: false,
        isSameRelease: false,
        pendingTrackPosition: "A1",
        pendingPreviewVideoUri: null,
      },
    });

    const inactive = playbackSessionReducer(playing, {
      type: "SET_TRANSPORT_OFF",
    });

    expect(getPlaybackSessionPhase(playing)).toBe("active");
    expect(getPlaybackSessionPhase(inactive)).toBe("inactive");
    expect(getPlaybackSessionPhase(initialPlaybackSessionState)).toBe("idle");
  });

  it("keeps reducer outputs valid across core transport actions", () => {
    const actions: PlaybackSessionAction[] = [
      {
        type: "PLAY_QUEUE_ITEM",
        params: {
          release,
          startPaused: false,
          isSameRelease: false,
          pendingTrackPosition: "A1",
          pendingPreviewVideoUri: null,
        },
      },
      { type: "PAUSE" },
      { type: "RESUME" },
      { type: "SET_TRANSPORT_OFF" },
      { type: "STOP" },
    ];

    let state: PlaybackSessionState = initialPlaybackSessionState;

    for (const action of actions) {
      state = playbackSessionReducer(state, action);
      const result = validatePlaybackSessionState(state);
      expect(result).toEqual({ ok: true });
    }
  });
});
