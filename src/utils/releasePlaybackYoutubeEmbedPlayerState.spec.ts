import { beforeEach, describe, expect, it } from "@jest/globals";
import { postYoutubePlayerCommand } from "src/utils/postYoutubePlayerCommand";
import { applyYoutubeEmbedPlayerStateChange } from "src/utils/releasePlaybackYoutubeEmbedPlayerState";
import {
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

jest.mock("src/utils/postYoutubePlayerCommand");

const mockPostYoutubePlayerCommand = postYoutubePlayerCommand as jest.Mock;

const visibilityState = {
  current: "visible" as DocumentVisibilityState,
};

type ApplyPlayerStateOverrides = {
  playerState?: number;
  isPausedRef?: { current: boolean };
  isPlaybackVideoUiLoadingRef?: { current: boolean };
  isWithinTrackSwitchGrace?: () => boolean;
  pendingPlayFromGestureRef?: { current: boolean };
};

const buildApplyInput = (overrides: ApplyPlayerStateOverrides = {}) => {
  const iframe = document.createElement("iframe");

  return {
    playerState: YOUTUBE_PLAYER_STATE_PLAYING,
    clearPlayFromGestureRetries: jest.fn(),
    completeEmbedPlaybackHandshake: jest.fn(),
    dispatchSession: jest.fn(),
    isPausedRef: { current: false },
    isPlaybackVideoUiLoadingRef: { current: false },
    isPlayingRef: { current: true },
    isWithinTrackSwitchGrace: () => false,
    notifyEmbedPlaybackEnded: jest.fn(),
    onEmbedTransportPaused: jest.fn(),
    pendingPlayFromGestureRef: { current: false },
    playbackIframeRef: { current: iframe },
    playbackVideoTransitionTargetIdRef: { current: null as string | null },
    tryConfirmAudibleEmbedPlayback: jest.fn(
      (_input: { playerState?: number }) => false,
    ),
    ...overrides,
  };
};

describe("releasePlaybackYoutubeEmbedPlayerState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    visibilityState.current = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState.current,
    });
  });

  it("when the embed ends, notifies playback ended without pausing the session", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_ENDED,
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.notifyEmbedPlaybackEnded).toHaveBeenCalledTimes(1);
    expect(input.dispatchSession).not.toHaveBeenCalled();
    expect(mockPostYoutubePlayerCommand).not.toHaveBeenCalled();
  });

  it("when pause arrives during track-switch grace, resumes the embed instead of pausing the session", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PAUSED,
      isWithinTrackSwitchGrace: () => true,
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(mockPostYoutubePlayerCommand).toHaveBeenCalledWith({
      iframe: input.playbackIframeRef.current,
      command: "playVideo",
    });
    expect(input.dispatchSession).not.toHaveBeenCalled();
    expect(input.onEmbedTransportPaused).not.toHaveBeenCalled();
  });

  it("when pause arrives while the document is hidden during video UI loading, leaves the session playing", () => {
    visibilityState.current = "hidden";
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PAUSED,
      isPlaybackVideoUiLoadingRef: { current: true },
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.dispatchSession).not.toHaveBeenCalled();
    expect(mockPostYoutubePlayerCommand).not.toHaveBeenCalled();
  });

  it("when pause arrives while playback is audible, pauses the session and clears the gesture retry", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PAUSED,
      pendingPlayFromGestureRef: { current: true },
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.pendingPlayFromGestureRef.current).toBe(false);
    expect(input.clearPlayFromGestureRetries).toHaveBeenCalledTimes(1);
    expect(input.onEmbedTransportPaused).toHaveBeenCalledTimes(1);
    expect(input.dispatchSession).toHaveBeenCalledWith({ type: "PAUSE" });
    expect(mockPostYoutubePlayerCommand).not.toHaveBeenCalled();
  });

  it("when playing arrives while the session is paused, resumes the session", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PLAYING,
      isPausedRef: { current: true },
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.dispatchSession).toHaveBeenCalledWith({ type: "RESUME" });
    expect(input.completeEmbedPlaybackHandshake).not.toHaveBeenCalled();
  });

  it("when playing arrives after the video UI has settled, completes the embed handshake", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PLAYING,
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.completeEmbedPlaybackHandshake).toHaveBeenCalledTimes(1);
    expect(input.tryConfirmAudibleEmbedPlayback).not.toHaveBeenCalled();
    expect(input.dispatchSession).not.toHaveBeenCalled();
  });

  it("when playing arrives while the video UI is still loading, confirms audible embed playback", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_PLAYING,
      isPlaybackVideoUiLoadingRef: { current: true },
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(input.tryConfirmAudibleEmbedPlayback).toHaveBeenCalledWith({
      playerState: YOUTUBE_PLAYER_STATE_PLAYING,
    });
    expect(input.completeEmbedPlaybackHandshake).not.toHaveBeenCalled();
  });

  it("when the embed is cued with a pending play gesture, sends playVideo", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_CUED,
      pendingPlayFromGestureRef: { current: true },
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(mockPostYoutubePlayerCommand).toHaveBeenCalledWith({
      iframe: input.playbackIframeRef.current,
      command: "playVideo",
    });
    expect(input.dispatchSession).not.toHaveBeenCalled();
  });

  it("when the embed is cued without a pending play gesture, does not send playVideo", () => {
    const input = buildApplyInput({
      playerState: YOUTUBE_PLAYER_STATE_CUED,
    });

    applyYoutubeEmbedPlayerStateChange(input);

    expect(mockPostYoutubePlayerCommand).not.toHaveBeenCalled();
    expect(input.dispatchSession).not.toHaveBeenCalled();
  });
});
