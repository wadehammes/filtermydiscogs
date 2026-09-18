import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useReleasePlaybackYoutubeEmbed } from "src/hooks/useReleasePlaybackYoutubeEmbed.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { definedProps } from "src/utils/definedProps";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { act, renderHook } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadAndPlayYoutubeVideo: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  refreshYoutubeEmbedPlayerLayout: jest.fn(),
  requestYoutubeEmbedPlaybackSync: jest.fn(),
}));

const buildHarness = ({
  isPaused = false,
  isPlaying = true,
  isPlaybackEmbedMounted = false,
  onYoutubeEmbedPlaybackError,
  onEmbedPlaybackConfirmed,
}: {
  isPaused?: boolean;
  isPlaying?: boolean;
  isPlaybackEmbedMounted?: boolean;
  onYoutubeEmbedPlaybackError?: (errorCode: number) => void;
  onEmbedPlaybackConfirmed?: () => void;
} = {}) => {
  const queryClient = createTestQueryClient();
  const release = releaseFactory.withDisplayDefaults();
  const playbackIframeRef = { current: null as HTMLIFrameElement | null };
  const embedVideoIdRef = { current: null as string | null };
  const lastSyncedActiveVideoIdRef = { current: null as string | null };
  const isPlayingRef = { current: isPlaying };
  const isPausedRef = { current: isPaused };
  const activeVideoIdRef = { current: null as string | null };
  const isPlaybackVideoUiLoadingRef = { current: false };
  const playbackVideoTransitionTargetIdRef = { current: null as string | null };
  const playbackVideoUiLoadingTargetVideoIdRef = {
    current: null as string | null,
  };
  const playbackVideoUiLoadingEmbedLoadStartedAtMsRef = {
    current: null as number | null,
  };
  const pendingPlayFromGestureRef = { current: false };
  const playFromGestureRetryTimeoutsRef = { current: [] as number[] };
  const releaseRef = { current: release };
  const tracksRef = { current: [] as never[] };
  const videosRef = { current: [] as never[] };
  const setEmbedVideoId = jest.fn();
  const setShouldAutoplayEmbed = jest.fn();
  const setIsPlaybackEmbedMounted = jest.fn();
  const onPlaybackEnded = jest.fn();
  const clearPlaybackVideoUiLoading = jest.fn();
  const dispatchSession = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(
    () =>
      useReleasePlaybackYoutubeEmbed({
        queryClient,
        dispatchSession,
        refs: {
          playbackIframeRef,
          embedVideoIdRef,
          lastSyncedActiveVideoIdRef,
          isPlayingRef,
          isPausedRef,
          activeVideoIdRef,
          isPlaybackVideoUiLoadingRef,
          pendingPlayFromGestureRef,
          playbackVideoTransitionTargetIdRef,
          playbackVideoUiLoadingTargetVideoIdRef,
          playbackVideoUiLoadingEmbedLoadStartedAtMsRef,
          playFromGestureRetryTimeoutsRef,
          releaseRef,
          tracksRef,
          videosRef,
        },
        isPlaying,
        isPaused,
        isPlaybackReady: true,
        isPlaybackEmbedMounted,
        activeVideoId: null,
        pendingTrackPosition: null,
        pendingPreviewVideoUri: null,
        releaseId: release.basic_information.id ?? null,
        releaseDetailId: release.basic_information.id,
        setEmbedVideoId,
        setShouldAutoplayEmbed,
        setIsPlaybackEmbedMounted,
        clearPlaybackVideoUiLoading,
        onPlaybackEnded,
        ...definedProps({
          onYoutubeEmbedPlaybackError,
          onEmbedPlaybackConfirmed,
        }),
      }),
    { wrapper },
  );

  return {
    activeVideoIdRef,
    clearPlaybackVideoUiLoading,
    embedVideoIdRef,
    isPlaybackVideoUiLoadingRef,
    pendingPlayFromGestureRef,
    playbackIframeRef,
    playbackVideoUiLoadingTargetVideoIdRef,
    result,
    setEmbedVideoId,
    setIsPlaybackEmbedMounted,
  };
};

const dispatchYoutubePlayerState = ({
  contentWindow,
  playerState,
  event = "onStateChange",
}: {
  contentWindow: Window;
  playerState: number;
  event?: "onStateChange" | "infoDelivery";
}) => {
  const data =
    event === "infoDelivery"
      ? JSON.stringify({
          event: "infoDelivery",
          info: { playerState },
        })
      : JSON.stringify({ event: "onStateChange", info: playerState });

  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      origin: "https://www.youtube.com",
      source: contentWindow,
    }),
  );
};

const dispatchYoutubePlayerError = ({
  contentWindow,
  errorCode,
}: {
  contentWindow: Window;
  errorCode: number;
}) => {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ event: "onError", info: errorCode }),
      origin: "https://www.youtube.com",
      source: contentWindow,
    }),
  );
};

describe("useReleasePlaybackYoutubeEmbed", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("syncEmbedToVideoId updates embed state and requests gesture unlock when no iframe is registered", () => {
    const {
      embedVideoIdRef,
      pendingPlayFromGestureRef,
      result,
      setEmbedVideoId,
    } = buildHarness({ isPaused: false });

    result.current.syncEmbedToVideoId("embed-video-id");

    expect(setEmbedVideoId).toHaveBeenCalledWith("embed-video-id");
    expect(embedVideoIdRef.current).toBe("embed-video-id");
    expect(pendingPlayFromGestureRef.current).toBe(true);
  });

  it("syncEmbedToVideoId does not request gesture unlock when the youtube video id is unchanged", () => {
    const { embedVideoIdRef, pendingPlayFromGestureRef, result } = buildHarness(
      {
        isPlaybackEmbedMounted: true,
      },
    );
    embedVideoIdRef.current = "same-video-id";

    result.current.syncEmbedToVideoId("same-video-id");

    expect(pendingPlayFromGestureRef.current).toBe(false);
  });

  it("syncEmbedToVideoId only updates embed state when the persistent iframe owns postMessage loads", () => {
    const {
      embedVideoIdRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      result,
      setEmbedVideoId,
    } = buildHarness({ isPlaybackEmbedMounted: true });
    playbackIframeRef.current = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    result.current.syncEmbedToVideoId("next-video-id");

    expect(setEmbedVideoId).toHaveBeenCalledWith("next-video-id");
    expect(embedVideoIdRef.current).toBe("next-video-id");
    expect(pendingPlayFromGestureRef.current).toBe(false);
  });

  it("registerPlaybackIframe clears the iframe ref when the embed unmounts", () => {
    const { playbackIframeRef, result } = buildHarness();
    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    result.current.registerPlaybackIframe(iframe);
    result.current.registerPlaybackIframe(null);

    expect(playbackIframeRef.current).toBeNull();
  });

  it("registerPlaybackIframe marks the embed mounted and enables listening", () => {
    const { result, setIsPlaybackEmbedMounted } = buildHarness();
    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    result.current.registerPlaybackIframe(iframe);

    expect(setIsPlaybackEmbedMounted).toHaveBeenCalledWith(true);
    expect(iframe.contentWindow?.postMessage).toHaveBeenCalled();
  });

  it("forwards YouTube onError messages to the playback error handler", () => {
    const onYoutubeEmbedPlaybackError = jest.fn();
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const { playbackIframeRef } = buildHarness({ onYoutubeEmbedPlaybackError });
    playbackIframeRef.current = { contentWindow } as HTMLIFrameElement;

    dispatchYoutubePlayerError({ contentWindow, errorCode: 100 });

    expect(onYoutubeEmbedPlaybackError).toHaveBeenCalledWith(100);
  });

  it("clears video UI loading on PLAYING when embed video id matches the loading target before activeVideoId catches up", () => {
    const onEmbedPlaybackConfirmed = jest.fn();
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const {
      activeVideoIdRef,
      clearPlaybackVideoUiLoading,
      embedVideoIdRef,
      isPlaybackVideoUiLoadingRef,
      playbackIframeRef,
      playbackVideoUiLoadingTargetVideoIdRef,
      result,
    } = buildHarness({
      onEmbedPlaybackConfirmed,
    });
    playbackIframeRef.current = { contentWindow } as HTMLIFrameElement;
    isPlaybackVideoUiLoadingRef.current = true;
    playbackVideoUiLoadingTargetVideoIdRef.current = "next-video-id";
    activeVideoIdRef.current = "prev-video-id";
    embedVideoIdRef.current = "next-video-id";

    result.current.notifyImperativeEmbedLoadStarted();

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    dispatchYoutubePlayerState({ contentWindow, playerState: 1 });

    expect(clearPlaybackVideoUiLoading).toHaveBeenCalled();
    expect(onEmbedPlaybackConfirmed).toHaveBeenCalled();
  });

  it("ignores stale PLAYING while video UI loading until imperative embed load starts", () => {
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const {
      activeVideoIdRef,
      clearPlaybackVideoUiLoading,
      isPlaybackVideoUiLoadingRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      playbackVideoUiLoadingTargetVideoIdRef,
      result,
    } = buildHarness();
    playbackIframeRef.current = { contentWindow } as HTMLIFrameElement;
    isPlaybackVideoUiLoadingRef.current = true;
    playbackVideoUiLoadingTargetVideoIdRef.current = "next-video-id";
    activeVideoIdRef.current = "next-video-id";
    pendingPlayFromGestureRef.current = true;

    dispatchYoutubePlayerState({ contentWindow, playerState: 1 });

    expect(clearPlaybackVideoUiLoading).not.toHaveBeenCalled();
    expect(pendingPlayFromGestureRef.current).toBe(true);

    result.current.notifyImperativeEmbedLoadStarted();

    expect(pendingPlayFromGestureRef.current).toBe(true);

    dispatchYoutubePlayerState({ contentWindow, playerState: 1 });

    expect(clearPlaybackVideoUiLoading).not.toHaveBeenCalled();
    expect(pendingPlayFromGestureRef.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    dispatchYoutubePlayerState({ contentWindow, playerState: 1 });

    expect(clearPlaybackVideoUiLoading).toHaveBeenCalled();
    expect(pendingPlayFromGestureRef.current).toBe(false);
  });

  it("confirms playback via infoDelivery after sync when early PLAYING was ignored", () => {
    const onEmbedPlaybackConfirmed = jest.fn();
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const {
      activeVideoIdRef,
      clearPlaybackVideoUiLoading,
      embedVideoIdRef,
      isPlaybackVideoUiLoadingRef,
      playbackIframeRef,
      playbackVideoUiLoadingTargetVideoIdRef,
      result,
    } = buildHarness({
      onEmbedPlaybackConfirmed,
    });
    playbackIframeRef.current = { contentWindow } as HTMLIFrameElement;
    isPlaybackVideoUiLoadingRef.current = true;
    playbackVideoUiLoadingTargetVideoIdRef.current = "next-video-id";
    activeVideoIdRef.current = "next-video-id";
    embedVideoIdRef.current = "next-video-id";

    result.current.notifyImperativeEmbedLoadStarted();

    dispatchYoutubePlayerState({ contentWindow, playerState: 1 });

    expect(clearPlaybackVideoUiLoading).not.toHaveBeenCalled();
    expect(onEmbedPlaybackConfirmed).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    dispatchYoutubePlayerState({
      contentWindow,
      playerState: 1,
      event: "infoDelivery",
    });

    expect(clearPlaybackVideoUiLoading).toHaveBeenCalled();
    expect(onEmbedPlaybackConfirmed).toHaveBeenCalled();
  });

  it("syncEmbedToVideoId does not request gesture unlock while transport is paused", () => {
    const { pendingPlayFromGestureRef, result, setEmbedVideoId } = buildHarness(
      {
        isPaused: true,
      },
    );

    result.current.syncEmbedToVideoId("embed-video-id");

    expect(setEmbedVideoId).toHaveBeenCalledWith("embed-video-id");
    expect(pendingPlayFromGestureRef.current).toBe(false);
  });
});
