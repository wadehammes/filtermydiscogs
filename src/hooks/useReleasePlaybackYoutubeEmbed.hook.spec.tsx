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
import { renderHook } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadAndPlayYoutubeVideo: jest.fn(),
  refreshYoutubeEmbedPlayerLayout: jest.fn(),
  requestYoutubeEmbedPlaybackSync: jest.fn(),
}));

const buildHarness = ({
  isPaused = false,
  isPlaying = true,
  isPlaybackEmbedMounted = false,
}: {
  isPaused?: boolean;
  isPlaying?: boolean;
  isPlaybackEmbedMounted?: boolean;
} = {}) => {
  const queryClient = createTestQueryClient();
  const release = releaseFactory.withDisplayDefaults();
  const playbackIframeRef = { current: null as HTMLIFrameElement | null };
  const embedVideoIdRef = { current: null as string | null };
  const lastSyncedActiveVideoIdRef = { current: null as string | null };
  const isPlayingRef = { current: isPlaying };
  const isPausedRef = { current: isPaused };
  const pendingPlayFromGestureRef = { current: false };
  const playFromGestureRetryTimeoutsRef = { current: [] as number[] };
  const releaseRef = { current: release };
  const tracksRef = { current: [] as never[] };
  const videosRef = { current: [] as never[] };
  const setEmbedVideoId = jest.fn();
  const setShouldAutoplayEmbed = jest.fn();
  const setIsPlaybackEmbedMounted = jest.fn();
  const onPlaybackEnded = jest.fn();
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
          pendingPlayFromGestureRef,
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
        onPlaybackEnded,
      }),
    { wrapper },
  );

  return {
    embedVideoIdRef,
    pendingPlayFromGestureRef,
    playbackIframeRef,
    result,
    setEmbedVideoId,
    setIsPlaybackEmbedMounted,
  };
};

describe("useReleasePlaybackYoutubeEmbed", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("syncEmbedToVideoId updates embed state and requests gesture unlock while transport is active", () => {
    const {
      embedVideoIdRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      result,
      setEmbedVideoId,
    } = buildHarness({ isPaused: false });
    playbackIframeRef.current = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

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

  it("syncEmbedToVideoId still updates embed state when the persistent iframe is already mounted", () => {
    const {
      embedVideoIdRef,
      pendingPlayFromGestureRef,
      result,
      setEmbedVideoId,
    } = buildHarness({ isPlaybackEmbedMounted: true });

    result.current.syncEmbedToVideoId("next-video-id");

    expect(setEmbedVideoId).toHaveBeenCalledWith("next-video-id");
    expect(embedVideoIdRef.current).toBe("next-video-id");
    expect(pendingPlayFromGestureRef.current).toBe(true);
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
