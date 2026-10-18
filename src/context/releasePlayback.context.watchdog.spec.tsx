import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  useReleasePlayback,
  useReleasePlaybackIframeActions,
} from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { userTrackStatsResponseFactory } from "src/tests/factories/UserTrackStatsResponse.factory";
import { setupMockCoarsePointerWithoutNetworkInfo } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
  resolvePlaybackVideoUiLoadingTimeoutMs,
  resolvePlaybackVideoUiLoadingTimeoutMsForArmMs,
} from "src/utils/playbackEmbedStartWatchdog";
import { createQueueItem } from "src/utils/playbackQueue";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
} from "src/utils/releasePlaybackEmbedConfirm";
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
const mockLoadAndPlayYoutubeVideo = jest.mocked(loadAndPlayYoutubeVideo);
const mockRequestYoutubeEmbedPlaybackSync = jest.mocked(
  requestYoutubeEmbedPlaybackSync,
);
const _mockRefreshYoutubeEmbedPlayerLayout = jest.mocked(
  refreshYoutubeEmbedPlayerLayout,
);
const mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);
const mockReportPlaybackSkipToSentry = jest.mocked(reportPlaybackSkipToSentry);

import {
  advanceEmbedWatchdogSyncProbeRecheck,
  advanceFirstSessionEmbedWatchdogFire,
  collectionRelease,
  createWrapper,
  dispatchYoutubeEmbedReady,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerError,
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  RELEASE_ID,
  releaseDetail,
  resolveFirstSessionEmbedWatchdogArmMs,
  resolveFirstSessionEmbedWatchdogArmMsForSlow,
  SHORT_RELEASE_ID,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
  shortReleaseDetail,
  similarHouseReleaseDetail,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — embed watchdog", () => {
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

  it("when embed pause UI left transport paused, starting another release plays without unavailable skip", async () => {
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
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    expect(result.current.isPaused).toBe(true);
    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
    });

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });

    expect(result.current.activeTrackPosition).toBe("1");
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when transport is paused on one track, starting another track on the same release switches without unavailable skip", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;

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
      result.current.togglePlayback();
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();
    mockLoadAndPlayYoutubeVideo.mockClear();

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "B1",
        youtubeVideoId: "abc12345678",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPaused).toBe(false);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("abc12345678");
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

  it("when cross-release switch from pause runs while the tab is hidden, the embed watchdog does not skip the new track", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();

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
      setDocumentVisibilityState("hidden");
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    setDocumentVisibilityState("visible");
    jest.useRealTimers();
  });

  it("does not arm the embed watchdog while transport is paused after refresh restore", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
        startPaused: true,
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.isPaused).toBe(true);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when restore same-video sync runs while paused, resuming still arms the embed watchdog", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.isPaused).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      result.current.notifyPlaybackVideoPresentationReady();
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.togglePlayback();
    });

    act(() => {
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS +
          PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
      );
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("arms the embed watchdog after resume when embed load started while paused", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
        startPaused: true,
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.togglePlayback();
    });

    advanceFirstSessionEmbedWatchdogFire();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("does not re-arm the embed watchdog after playback is confirmed for the same video load", async () => {
    jest.useFakeTimers();

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(
      () => ({
        ...useReleasePlayback(),
        ...useReleasePlaybackIframeActions(),
      }),
      {
        wrapper: createWrapper([collectionRelease]),
      },
    );

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
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      result.current.notifyPlaybackVideoPresentationReady();
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when override-only playback starts before track stats load, embed watchdog does not skip before stats resolve", async () => {
    jest.useFakeTimers();

    const overrideVideoId = "overrid1234";
    const overrideOnlyDetail = discogsReleaseJsonFactory.withTracklistAndVideos(
      {
        id: RELEASE_ID,
        videos: [],
        tracklist: [
          discogsTrackFactory.build({
            position: "A1",
            title: "Override Track",
            duration: "3:32",
            type_: "track",
          }),
        ],
      },
    );
    const overrideCollectionRelease = releaseFactory.withDisplayDefaults({
      instance_id: "watchdog-override-instance",
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Override Album",
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const trackKey = `${overrideCollectionRelease.instance_id}:A1`;

    setupFetchDiscogsReleaseMock(mockApi, overrideOnlyDetail);

    let resolveTrackStats!: (
      value: ReturnType<typeof userTrackStatsResponseFactory.build>,
    ) => void;
    const trackStatsPromise = new Promise<
      ReturnType<typeof userTrackStatsResponseFactory.build>
    >((resolve) => {
      resolveTrackStats = resolve;
    });
    mockApi.fetchTrackStats.mockImplementation(() => trackStatsPromise);

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([overrideCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: overrideCollectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted(overrideVideoId);
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    await act(async () => {
      resolveTrackStats(
        userTrackStatsResponseFactory.build({
          stats: {
            [trackKey]: {
              play_count: 0,
              listen_count: 0,
              youtube_id: overrideVideoId,
            },
          },
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.activeVideoId).toBe(overrideVideoId);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow: iframe.contentWindow as Window,
        playerState: 1,
      });
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();
    expect(result.current.activeTrackPosition).toBe("A1");

    jest.useRealTimers();
  });

  it("before unavailable skip, requests embed playback sync once when transport is still playing", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

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
      result.current.notifyPlaybackVideoLoadStarted();
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    mockRequestYoutubeEmbedPlaybackSync.mockClear();

    act(() => {
      jest.advanceTimersByTime(
        resolveFirstSessionEmbedWatchdogArmMs() -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockRequestYoutubeEmbedPlaybackSync).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("silent embed contract: watchdog unavailable skip when the iframe never posts player messages (pairs with E2E mock mode=silent)", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
    });

    advanceFirstSessionEmbedWatchdogFire();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("when presentation is ready while transport is playing, confirms embed playback so the watchdog does not skip", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(
      () => ({
        ...useReleasePlayback(),
        ...useReleasePlaybackIframeActions(),
      }),
      {
        wrapper: createWrapper([collectionRelease]),
      },
    );

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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
      result.current.notifyPlaybackVideoPresentationReady();
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when YouTube posts onReady after load started, confirms embed playback so the watchdog does not skip", async () => {
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
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeEmbedReady({ contentWindow });
    });

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMs());
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("extends the first embed watchdog arm by initial presentation grace before unavailable skip", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
      );
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    expect(mockReportPlaybackSkipToSentry).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          watchdogMs: resolveFirstSessionEmbedWatchdogArmMs(),
        }),
      }),
    );

    jest.useRealTimers();
  });

  it("re-applies initial presentation watchdog grace when a new embed load resets confirmation", async () => {
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
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
      dispatchYoutubeEmbedReady({ contentWindow });
    });

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("abc12345678");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("skips and advances when YouTube posts onError for the active embed", async () => {
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

    mockAppendPlaybackSkipAndSchedule.mockImplementation((_entry, onSkip) => {
      onSkip();
    });
    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      dispatchYoutubePlayerError({ contentWindow, errorCode: 100 });
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);
    expect(mockAppendPlaybackSkipAndSchedule.mock.calls[0]?.[0]?.reason).toBe(
      "Private or removed on YouTube",
    );

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });
  });

  it("stops playback when an unavailable skip advances with an empty queue", async () => {
    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "B1",
        rebuildAlbumQueue: false,
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });

    mockAppendPlaybackSkipAndSchedule.mockImplementation((_entry, onSkip) => {
      onSkip();
    });
    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      dispatchYoutubePlayerError({ contentWindow, errorCode: 100 });
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBeNull();
      expect(result.current.isMiniPlayerVisible).toBe(false);
    });
  });

  it("does not treat immediate stale PLAYING as confirmed so the embed watchdog can skip", async () => {
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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMs());
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    advanceFirstSessionEmbedWatchdogFire();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("when coarse pointer and unknown connection, re-arms embed watchdog after the first mobile delay", async () => {
    jest.useFakeTimers();
    const restoreCoarsePointer = setupMockCoarsePointerWithoutNetworkInfo();

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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMsForSlow());
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMsForSlow());
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    restoreCoarsePointer();
    jest.useRealTimers();
  });

  it("when coarse pointer and unknown connection, keeps video UI loading past the fast-tier loading cap before re-arm", async () => {
    jest.useFakeTimers();
    const restoreCoarsePointer = setupMockCoarsePointerWithoutNetworkInfo();

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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    const pastFastTierLoadingCapMs =
      resolvePlaybackVideoUiLoadingTimeoutMsForArmMs(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
      ) + 100;

    act(() => {
      jest.advanceTimersByTime(pastFastTierLoadingCapMs);
    });

    expect(result.current.isPlaybackVideoLoading).toBe(true);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    restoreCoarsePointer();
    jest.useRealTimers();
  });

  it("re-arms the embed watchdog while video UI loading before unavailable skip", async () => {
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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMs());
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    advanceFirstSessionEmbedWatchdogFire();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("waits for the slow-network watchdog delay before unavailable skip", async () => {
    jest.useFakeTimers();
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    const originalConnection = navigatorWithConnection.connection;

    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { effectiveType: "2g" },
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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMsForSlow());
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMsForSlow());
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    expect(mockReportPlaybackSkipToSentry).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: -1,
        context: expect.objectContaining({
          connectionQuality: "slow",
          releaseId: RELEASE_ID,
          releaseTitle: "Never Gonna Give You Up",
          instanceId: collectionRelease.instance_id,
          trackPosition: "B1",
          trackTitle: "Never Gonna Give You Up (Instrumental)",
          trackKey: `${collectionRelease.instance_id}:B1`,
          watchdogMs: resolveFirstSessionEmbedWatchdogArmMsForSlow(),
          youtubeVideoId: "abc12345678",
        }),
      }),
    );

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: -1,
        context: expect.objectContaining({
          trackKey: `${collectionRelease.instance_id}:B1`,
          youtubeVideoId: "abc12345678",
        }),
      }),
      expect.any(Function),
    );

    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: originalConnection,
    });
    jest.useRealTimers();
  });

  it("confirms embed playback from infoDelivery currentTime alone so the watchdog does not skip", async () => {
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
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 1.2 },
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

  it("after unavailable skip advances the queue, does not skip audible playback on the next track", async () => {
    jest.useFakeTimers();

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
    });

    act(() => {
      result.current.addToQueue({
        release: shortCollectionRelease,
        trackPosition: "1",
        trackTitle: "Short A",
      });
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
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    advanceFirstSessionEmbedWatchdogFire();

    if (mockAppendPlaybackSkipAndSchedule.mock.calls.length === 0) {
      advanceFirstSessionEmbedWatchdogFire();
    }

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { playerState: 1, currentTime: 4.2 },
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
    });

    act(() => {
      jest.advanceTimersByTime(
        resolveFirstSessionEmbedWatchdogArmMs() +
          PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS +
          resolvePlaybackVideoUiLoadingTimeoutMs(),
      );
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not run unavailable skip when the embed watchdog outlives a queue advance to another video id", async () => {
    jest.useFakeTimers();

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

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
      expect(result.current.embedVideoId).toBe("abc12345678");
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("when playNext upload plays after the video UI loading cap, embed watchdog does not skip", async () => {
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
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("abc12345678");
    });

    act(() => {
      jest.advanceTimersByTime(resolvePlaybackVideoUiLoadingTimeoutMs());
    });

    expect(result.current.isPlaybackVideoLoading).toBe(false);

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMs());
    });
    advanceEmbedWatchdogSyncProbeRecheck();

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not run the embed watchdog skip while the tab stays hidden during embed load", async () => {
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
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted();
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    act(() => {
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

    setDocumentVisibilityState("visible");
    jest.useRealTimers();
  });

  it("does not unavailable-skip confirmed playback while similar queue tail is loading", async () => {
    jest.useFakeTimers();
    setDocumentVisibilityState("visible");

    mockUserPreferencesResponse(
      userPreferencesFactory.build({ extendQueueWithSimilarReleases: true }),
    );

    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: SHORT_RELEASE_ID,
        title: "Short EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${SHORT_RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100003,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100003",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, shortReleaseDetail, {
      "100003": { ...similarHouseReleaseDetail, id: 100003 },
    });

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(
      () => new Promise(() => undefined),
    );

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(
      () => ({
        playback: useReleasePlayback(),
        iframeActions: useReleasePlaybackIframeActions(),
      }),
      {
        wrapper: createWrapper([sourceRelease, similarRelease]),
      },
    );

    await waitFor(() => {
      expect(result.current.playback.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.playback.startPlayback({
        release: sourceRelease,
        trackPosition: "1",
      });
      result.current.iframeActions.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.playback.isQueueBuilding).toBe(true);
      expect(mockFetchPlayableQueuesForSimilarReleases).toHaveBeenCalled();
    });

    act(() => {
      result.current.iframeActions.notifyPlaybackVideoLoadStarted(
        "def98765432",
      );
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.iframeActions.notifyPlaybackVideoLoadStarted(
        "similar12345",
      );
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not unavailable-skip after similar tail fetch ends when embed playback is confirmed", async () => {
    jest.useFakeTimers();
    setDocumentVisibilityState("visible");

    mockUserPreferencesResponse(
      userPreferencesFactory.build({ extendQueueWithSimilarReleases: true }),
    );

    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: SHORT_RELEASE_ID,
        title: "Short EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${SHORT_RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100003,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100003",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, shortReleaseDetail, {
      "100003": { ...similarHouseReleaseDetail, id: 100003 },
    });

    let resolveSimilarFetch: (value: PlaybackQueueItem[][]) => void = () => {
      undefined;
    };

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSimilarFetch = resolve;
        }),
    );

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
    const iframe = { contentWindow } as HTMLIFrameElement;

    const { result } = renderHook(
      () => ({
        playback: useReleasePlayback(),
        iframeActions: useReleasePlaybackIframeActions(),
      }),
      {
        wrapper: createWrapper([sourceRelease, similarRelease]),
      },
    );

    await waitFor(() => {
      expect(result.current.playback.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.playback.startPlayback({
        release: sourceRelease,
        trackPosition: "1",
      });
      result.current.iframeActions.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.playback.isQueueBuilding).toBe(true);
    });

    act(() => {
      result.current.iframeActions.notifyPlaybackVideoLoadStarted(
        "def98765432",
      );
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      resolveSimilarFetch([
        [
          createQueueItem({
            release: similarRelease,
            trackPosition: "A1",
            trackTitle: "Similar Track",
          }),
        ],
      ]);
    });

    await waitFor(() => {
      expect(result.current.playback.isQueueBuilding).toBe(false);
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
