import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
} from "src/utils/playbackEmbedStartWatchdog";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import {
  EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
  HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
} from "src/utils/youtubeIframeEvents";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/similarReleaseQueue", () => ({
  fetchPlayableQueuesForSimilarReleases: jest.fn(),
}));
jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadAndPlayYoutubeVideo: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  refreshYoutubeEmbedPlayerLayout: jest.fn(),
  requestYoutubeEmbedPlaybackSync: jest.fn(),
}));
jest.mock("src/utils/playbackSkippedTrackToast", () => ({
  appendPlaybackSkipAndSchedule: jest.fn(),
  resetPlaybackSkipLogToast: jest.fn(),
  PLAYBACK_SKIPPED_TRACKS_TOAST_ID: "playback-skipped-tracks",
}));
jest.mock("src/lib/sentry/reportPlaybackSkip", () => ({
  reportPlaybackSkipToSentry: jest.fn(),
  resolvePlaybackSkipSource: (errorCode: number) =>
    errorCode === -1 ? "watchdog" : "youtube",
  resolvePlaybackSkipSentryLevel: (source: string) =>
    source === "watchdog" ? "warning" : "info",
}));

const actualSimilarReleaseQueue = jest.requireActual<
  typeof import("src/utils/similarReleaseQueue")
>("src/utils/similarReleaseQueue");
const mockFetchPlayableQueuesForSimilarReleases = jest.mocked(
  fetchPlayableQueuesForSimilarReleases,
);
const mockPostYoutubePlayerCommand = jest.mocked(postYoutubePlayerCommand);
const _mockLoadAndPlayYoutubeVideo = jest.mocked(loadAndPlayYoutubeVideo);
const mockRequestYoutubeEmbedPlaybackSync = jest.mocked(
  requestYoutubeEmbedPlaybackSync,
);
const mockRefreshYoutubeEmbedPlayerLayout = jest.mocked(
  refreshYoutubeEmbedPlayerLayout,
);
const mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);
const _mockReportPlaybackSkipToSentry = jest.mocked(reportPlaybackSkipToSentry);

import {
  advanceEmbedWatchdogSyncProbeRecheck,
  collectionRelease,
  createWrapper,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerError,
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  releaseDetail,
  resolveFirstSessionEmbedWatchdogArmMs,
  SHORT_RELEASE_ID,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — hidden tab", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    mockPostYoutubePlayerCommand.mockClear();
    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(
      actualSimilarReleaseQueue.fetchPlayableQueuesForSimilarReleases,
    );
    mockUserPreferencesResponse();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(mockApi, releaseDetail);
  });

  it("polls player state in a hidden tab and advances when the embed reports ended", async () => {
    jest.useFakeTimers();
    setDocumentVisibilityState("hidden");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    mockRequestYoutubeEmbedPlaybackSync.mockClear();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRequestYoutubeEmbedPlaybackSync.mock.calls[0]?.[0]).toBe(iframe);

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
        event: "infoDelivery",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });

    jest.useRealTimers();
    setDocumentVisibilityState("visible");
  });

  it("ignores background-tab pause events so the queue can advance while hidden", async () => {
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      setDocumentVisibilityState("hidden");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    expect(result.current.isPaused).toBe(false);

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });
  });

  it("syncs embed playback when the tab becomes visible again", async () => {
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    mockRequestYoutubeEmbedPlaybackSync.mockClear();

    act(() => {
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRequestYoutubeEmbedPlaybackSync.mock.calls[0]?.[0]).toBe(iframe);
  });

  it("resolves the next playback video id immediately when advancing the queue in a hidden tab", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.playbackVideoId).toBe("abc12345678");
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("syncs embed pause while the document is hidden and still advances the queue on end", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("when the tab is hidden and transport pauses before end, background polling still advances the queue", async () => {
    jest.useFakeTimers();

    setDocumentVisibilityState("hidden");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: {
          playerState: 2,
          currentTime: 180,
          duration: 180,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });

    setDocumentVisibilityState("visible");
    jest.useRealTimers();
  });

  it("after hidden tab unavailable skip advances queue, refocus does not skip the next playable track", async () => {
    jest.useFakeTimers();
    setDocumentVisibilityState("hidden");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    mockAppendPlaybackSkipAndSchedule.mockImplementation((_entry, onSkip) => {
      onSkip();
    });

    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      result.current.addToQueue({
        release: shortCollectionRelease,
        trackPosition: "1",
        trackTitle: "Short A",
      });
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      dispatchYoutubePlayerError({ contentWindow, errorCode: 100 });
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { playerState: 1, currentTime: 3.5 },
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    act(() => {
      jest.advanceTimersByTime(
        resolveFirstSessionEmbedWatchdogArmMs() +
          PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS,
      );
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();
    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);

    setDocumentVisibilityState("visible");
    jest.useRealTimers();
  });

  it("advances in a hidden tab after PiP closes without falsely skipping when the tab refocuses", async () => {
    jest.useFakeTimers();
    setDocumentVisibilityState("hidden");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    expect(result.current.isPaused).toBe(false);

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();
    expect(result.current.activeTrackPosition).toBe("B1");
    expect(result.current.isPaused).toBe(false);

    setDocumentVisibilityState("visible");
    jest.useRealTimers();
  });

  it("does not run the embed watchdog skip after pausing in a hidden tab", async () => {
    jest.useFakeTimers();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      jest.advanceTimersByTime(EMBED_TRACK_SWITCH_PAUSE_GRACE_MS + 1);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    jest.useRealTimers();
  });

  it("requests player state when the document becomes visible during playback", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const iframe = document.createElement("iframe");

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    mockRequestYoutubeEmbedPlaybackSync.mockClear();
    mockRefreshYoutubeEmbedPlayerLayout.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRequestYoutubeEmbedPlaybackSync.mock.calls[0]?.[0]).toBe(iframe);
    expect(mockRefreshYoutubeEmbedPlayerLayout.mock.calls[0]?.[0]?.iframe).toBe(
      iframe,
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });
});
