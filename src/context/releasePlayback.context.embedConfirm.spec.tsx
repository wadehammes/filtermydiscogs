import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS } from "src/utils/playbackEmbedStartWatchdog";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
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
const _mockRefreshYoutubeEmbedPlayerLayout = jest.mocked(
  refreshYoutubeEmbedPlayerLayout,
);
const mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);
const _mockReportPlaybackSkipToSentry = jest.mocked(reportPlaybackSkipToSentry);

import {
  collectionRelease,
  createWrapper,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  releaseDetail,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — embed confirm", () => {
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

  it("confirms queue advance via infoDelivery after sync when only early PLAYING arrived", async () => {
    jest.useFakeTimers();

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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("abc12345678");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    expect(mockRequestYoutubeEmbedPlaybackSync.mock.calls[0]?.[0]).toBe(iframe);

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
        event: "infoDelivery",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when video UI loading starts from queue advance without imperative embed load, infoDelivery currentTime confirms and clears loading", async () => {
    jest.useFakeTimers();

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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 0.8 },
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    jest.useRealTimers();
  });

  it("confirms embed playback after the post-load PLAYING delay during video UI loading", async () => {
    jest.useFakeTimers();

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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("playNext keeps video UI loading until the advanced upload reports playing", async () => {
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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);

    jest.useFakeTimers();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    jest.useRealTimers();

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });
  });
});
