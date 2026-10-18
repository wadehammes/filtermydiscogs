import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
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
import { writePersistedReleasePlayback } from "src/utils/releasePlaybackStorage";
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
const _mockRequestYoutubeEmbedPlaybackSync = jest.mocked(
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
  RELEASE_ID,
  releaseDetail,
  SHORT_RELEASE_ID,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
  shortReleaseDetail,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — track switch, pause, and restore", () => {
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

  it("when infoDelivery reports the prior upload at end during cross-release switch from pause, playback stays on the new track", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

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
    });

    act(() => {
      result.current.togglePlayback();
    });

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 329, duration: 330, playerState: 2 },
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
    });

    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when cross-release switch from pause is confirmed, a later ended on the new track does not revert to the prior release", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

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
    });

    act(() => {
      result.current.togglePlayback();
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);
    expect(result.current.activeTrackPosition).toBe("1");

    jest.useRealTimers();
  });

  it("when another release is started from pause twice, playback stays on the last selected track", async () => {
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

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
    });

    act(() => {
      result.current.togglePlayback();
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "B1",
        youtubeVideoId: "abc12345678",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.release?.basic_information.id).toBe(RELEASE_ID);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    expect(result.current.activeTrackPosition).toBe("B1");
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();
  });

  it("when transport is paused, playQueueAtIndex on a cross-release row does not unavailable-skip", async () => {
    jest.useFakeTimers();
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ autoPlayOnQueueAdd: false }),
    );
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.autoPlayOnQueueAdd).toBe(false);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
      result.current.addToQueue({
        release: shortCollectionRelease,
        trackPosition: "1",
        trackTitle: "Short A",
      });
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
      expect(result.current.queue).toHaveLength(2);
    });

    act(() => {
      result.current.togglePlayback();
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.playQueueAtIndex(1);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 329, duration: 330, playerState: 2 },
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when transport is paused, starting a release preview on another upload does not unavailable-skip", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;
    const previewVideo = shortReleaseDetail.videos?.[0];

    if (!previewVideo) {
      throw new Error("expected short release preview video fixture");
    }

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
    });

    act(() => {
      result.current.togglePlayback();
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.startReleasePreview({
        release: shortCollectionRelease,
        video: previewVideo,
      });
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 329, duration: 330, playerState: 2 },
      });
    });

    await waitFor(() => {
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
      expect(result.current.isPaused).toBe(false);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when restore rehydrates a paused session, starting another release does not unavailable-skip", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    act(() => {
      result.current.registerPlaybackIframe(iframe);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 329, duration: 330, playerState: 2 },
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.isPaused).toBe(false);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("keeps autoplaying the next track when the embed pauses during a visible track switch", async () => {
    setDocumentVisibilityState("visible");

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

    mockPostYoutubePlayerCommand.mockClear();

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    expect(result.current.isPaused).toBe(false);

    const playVideoCalls = mockPostYoutubePlayerCommand.mock.calls.filter(
      ([args]) => args.command === "playVideo" && args.iframe === iframe,
    );

    expect(playVideoCalls.length).toBeGreaterThan(0);
  });
});
