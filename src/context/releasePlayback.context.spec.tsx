import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import { api } from "src/api/urls";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
  useReleasePlaybackIframeActions,
} from "src/context/releasePlayback.context";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import {
  collectionRelease,
  RELEASE_ID,
  releaseDetail,
  SHORT_RELEASE_ID,
  shortCollectionRelease,
  shortReleaseDetail,
  similarHouseReleaseDetail,
} from "src/tests/fixtures/releasePlaybackProvider.spec.fixtures";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  createAuthCheckingWrapper,
  createWrapper,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerError,
  dispatchYoutubePlayerState,
  mockUserPreferencesResponse,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
} from "src/tests/utils/releasePlaybackProvider.spec.utils";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS } from "src/utils/playbackEmbedStartWatchdog";
import { createQueueItem } from "src/utils/playbackQueue";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import {
  readPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { EMBED_TRACK_SWITCH_PAUSE_GRACE_MS } from "src/utils/youtubeIframeEvents";
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
const mockRefreshYoutubeEmbedPlayerLayout = jest.mocked(
  refreshYoutubeEmbedPlayerLayout,
);
const mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);
const mockApi = jest.mocked(api);
describe("ReleasePlaybackProvider", () => {
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

  it("starts playback and resolves the selected track", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.activeVideoId).toBe("te2jJncBVG4");
    expect(result.current.isPlaying).toBe(true);
  });

  it("advances the queue when the YouTube embed reports playback ended", async () => {
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
      expect(result.current.queue[0]?.trackPosition).toBe("B1");
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 0 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });

    expect(result.current.embedVideoId).toBe("abc12345678");
    expect(result.current.activeVideoId).toBe("abc12345678");
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

  it("advances the queue when infoDelivery reports playback ended", async () => {
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
        event: "infoDelivery",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });
  });

  it("advances the queue when infoDelivery reports the embed at the end by time", async () => {
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
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            event: "infoDelivery",
            info: { currentTime: 211.5, duration: 212, playerState: 2 },
          }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });
  });

  it("requests playVideo when the embed iframe registers after a user gesture", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    const iframe = document.createElement("iframe");

    act(() => {
      result.current.registerPlaybackIframe(iframe);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const playVideoCalls = mockPostYoutubePlayerCommand.mock.calls.filter(
      ([args]) => args.command === "playVideo" && args.iframe === iframe,
    );

    expect(playVideoCalls.length).toBeGreaterThan(0);

    jest.useRealTimers();
  });

  it("toggles paused state while playback is active", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      result.current.togglePlayback();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.togglePlayback();
    });

    expect(result.current.isPaused).toBe(false);
  });

  it("syncs paused state when the YouTube embed reports pause from the video UI", async () => {
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
      expect(result.current.isPaused).toBe(false);
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

    expect(result.current.isPaused).toBe(true);

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPaused).toBe(false);
  });

  it("does not skip a new release track when embed playing confirms before the load delay elapses", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
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
      result.current.togglePlayback();
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
      expect(result.current.isPaused).toBe(false);
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
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
    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not advance when a stale embed ended arrives after starting another release from pause", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");

    const postMessage = jest.fn();
    const contentWindow = { postMessage } as unknown as Window;
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
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
      result.current.togglePlayback();
    });

    expect(result.current.isPaused).toBe(true);

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
      });
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(false);
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("def98765432");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 0,
      });
    });

    expect(result.current.activeTrackPosition).toBe("1");
    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
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

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("does not re-arm the embed watchdog after playback is confirmed for the same video load", async () => {
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

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("te2jJncBVG4");
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

  it("schedules unavailable skip toast when embed load starts but playback never confirms", async () => {
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

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

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
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
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

  it("does not imperatively loadAndPlay on playNext when the playback iframe stays registered", async () => {
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

    mockLoadAndPlayYoutubeVideo.mockClear();

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.playbackVideoId).toBe("abc12345678");
    });

    expect(mockLoadAndPlayYoutubeVideo).not.toHaveBeenCalled();
  });

  it("playNext replays the active track when it is queued again in up next", async () => {
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
        rebuildAlbumQueue: false,
      });
      result.current.registerPlaybackIframe(iframe);
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.queue).toHaveLength(0);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "A1",
        trackTitle: "Never Gonna Give You Up",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    mockLoadAndPlayYoutubeVideo.mockClear();

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalled();
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
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).toHaveBeenCalledTimes(1);

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

  it("advances the queue when embed infoDelivery reports playback ended", async () => {
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
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            event: "infoDelivery",
            info: { playerState: 0 },
          }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(0);
    });
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

  it("posts YouTube commands on each play/pause toggle after iframe registration", async () => {
    const iframe = document.createElement("iframe");

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      result.current.registerPlaybackIframe(iframe);
    });

    mockPostYoutubePlayerCommand.mockClear();

    act(() => {
      result.current.togglePlayback();
    });

    expect(mockPostYoutubePlayerCommand.mock.calls).toContainEqual([
      { iframe, command: "pauseVideo" },
    ]);

    act(() => {
      result.current.togglePlayback();
    });

    expect(mockPostYoutubePlayerCommand.mock.calls.at(-1)).toEqual([
      { iframe, command: "playVideo" },
    ]);
  });

  it("plays the selected track when switching from a longer release queue", async () => {
    const longTracklistRelease =
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: 100001,
        tracklist: Array.from({ length: 10 }, (_, index) => ({
          position: String(index + 1),
          title: `Track ${index + 1}`,
          duration: "3:00",
          type_: "track" as const,
        })),
        videos: [
          {
            description: "Track video",
            duration: 180,
            embed: true,
            title: "Track 1",
            uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
          },
        ],
      });

    const shortRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Short EP",
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, longTracklistRelease, {
      "100002": discogsReleaseJsonFactory.withTracklistAndVideos({
        id: 100002,
        tracklist: [
          {
            position: "1",
            title: "Short A",
            duration: "2:00",
            type_: "track",
          },
          {
            position: "2",
            title: "Short B",
            duration: "2:30",
            type_: "track",
          },
          {
            position: "3",
            title: "Short C",
            duration: "3:00",
            type_: "track",
          },
        ],
        videos: [
          {
            description: "Short C",
            duration: 180,
            embed: true,
            title: "Short C",
            uri: "https://www.youtube.com/watch?v=xyz98765432",
          },
        ],
      }),
    });

    const longCollectionRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100001,
        title: "Long Album",
        resource_url: "https://api.discogs.com/releases/100001",
      }),
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([longCollectionRelease, shortRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: longCollectionRelease,
        trackPosition: "1",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
    });

    act(() => {
      result.current.startPlayback({
        release: shortRelease,
        trackPosition: "3",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("3");
    });
  });

  it("switches tracks on the same release without waiting for tracklist reload", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "B1",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });
  });

  it("stops playback when the requested track position is not in the tracklist", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "Z99",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(false);
    });

    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("stops playback and clears release state", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    act(() => {
      result.current.stopPlayback();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.release).toBeNull();
    expect(result.current.activeTrackPosition).toBeNull();
    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("persists playback state as soon as playback starts", () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
      queue: [],
    });
  });

  it("persists playback state while a track is playing", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
      queue: [
        {
          instanceId: String(collectionRelease.instance_id),
          trackPosition: "B1",
          trackTitle: "Never Gonna Give You Up (Instrumental)",
        },
      ],
    });
  });

  it("restores playback from localStorage after the collection is ready", async () => {
    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.isPaused).toBe(true);
    });
  });

  it("restores a persisted upcoming queue after refresh", async () => {
    const queuedItem = createQueueItem({
      release: shortCollectionRelease,
      trackPosition: "1",
      trackTitle: "Short A",
    });

    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
      queue: [toPersistedQueueItem(queuedItem)],
    });

    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]?.trackPosition).toBe("1");
      expect(result.current.queue[0]?.release.instance_id).toBe(
        shortCollectionRelease.instance_id,
      );
    });
  });

  it("persists manual queue additions", async () => {
    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
        rebuildAlbumQueue: false,
      });
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

    await waitFor(() => {
      expect(readPersistedReleasePlayback()?.queue).toEqual([
        {
          instanceId: String(shortCollectionRelease.instance_id),
          trackPosition: "1",
          trackTitle: "Short A",
        },
      ]);
    });
  });

  it("waits for auth before clearing persisted playback", () => {
    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createAuthCheckingWrapper(),
    });

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("waits for the collection to load before giving up restore", async () => {
    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders authInitialState={testAuthenticatedAuthState}>
          <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
        </TestProviders>
      ),
    });

    expect(readPersistedReleasePlayback()).not.toBeNull();
    expect(result.current.isPlaying).toBe(false);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it("waits for additional collection pages before giving up restore", async () => {
    writePersistedReleasePlayback({
      instanceId: String(collectionRelease.instance_id),
      trackPosition: "A1",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([], {
        collectionPage: 1,
        collectionTotalPages: 2,
      }),
    });

    expect(readPersistedReleasePlayback()).not.toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it("rebuilds the album queue when playback starts on a track", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    expect(result.current.canPlayNext).toBe(true);
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.queue[0]?.trackPosition).toBe("B1");
  });

  it("sets isQueueBuilding while similar releases are loading", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ extendQueueWithSimilarReleases: true }),
    );
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
      "100002": similarHouseReleaseDetail,
    });

    let resolveSimilarFetch: ((value: PlaybackQueueItem[][]) => void) | null =
      null;
    let similarFetchCallCount = 0;
    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(() => {
      similarFetchCallCount += 1;

      if (similarFetchCallCount === 1) {
        return new Promise((resolve) => {
          resolveSimilarFetch = resolve;
        });
      }

      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    await waitFor(() => {
      expect(result.current.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue.length).toBeGreaterThanOrEqual(1);
      expect(result.current.isQueueBuilding).toBe(true);
      expect(mockFetchPlayableQueuesForSimilarReleases).toHaveBeenCalled();
    });

    await act(async () => {
      resolveSimilarFetch?.([
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
      expect(result.current.isQueueBuilding).toBe(false);
      expect(result.current.queue).toHaveLength(2);
    });
  });

  it("appends one similar track when the queue runs low and the preference is enabled", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ extendQueueWithSimilarReleases: true }),
    );
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
      "100002": similarHouseReleaseDetail,
    });

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(async () => [
      [
        createQueueItem({
          release: similarRelease,
          trackPosition: "A1",
          trackTitle: "Similar Track",
        }),
      ],
    ]);

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    await waitFor(() => {
      expect(result.current.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(mockFetchPlayableQueuesForSimilarReleases).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(2);
    });

    expect(result.current.queue[1]?.instanceId).toBe(
      similarRelease.instance_id,
    );
    expect(result.current.queue[1]?.trackPosition).toBe("A1");
  });

  it("appends a similar track when upcoming is empty after a single-track album play", async () => {
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

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(async () => [
      [
        createQueueItem({
          release: similarRelease,
          trackPosition: "A1",
          trackTitle: "Similar Track",
        }),
      ],
    ]);

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    await waitFor(() => {
      expect(result.current.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "1",
      });
    });

    await waitFor(() => {
      expect(mockFetchPlayableQueuesForSimilarReleases).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    expect(result.current.queue[0]?.instanceId).toBe(
      similarRelease.instance_id,
    );
  });

  it("does not append similar tracks after clear queue while playback continues", async () => {
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

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(async () => [
      [
        createQueueItem({
          release: similarRelease,
          trackPosition: "A1",
          trackTitle: "Similar Track",
        }),
      ],
    ]);

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    await waitFor(() => {
      expect(result.current.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    const fetchCountAfterPlay =
      mockFetchPlayableQueuesForSimilarReleases.mock.calls.length;

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queue).toHaveLength(0);
    expect(result.current.isPlaying).toBe(true);

    await waitFor(() => {
      expect(mockFetchPlayableQueuesForSimilarReleases.mock.calls.length).toBe(
        fetchCountAfterPlay,
      );
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it("does not append another similar track after removing the generated queue row", async () => {
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

    mockFetchPlayableQueuesForSimilarReleases.mockImplementation(async () => [
      [
        createQueueItem({
          release: similarRelease,
          trackPosition: "A1",
          trackTitle: "Similar Track",
        }),
      ],
    ]);

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    await waitFor(() => {
      expect(result.current.extendQueueWithSimilarReleases).toBe(true);
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    const fetchCountAfterPlay =
      mockFetchPlayableQueuesForSimilarReleases.mock.calls.length;

    act(() => {
      result.current.removeFromQueue(0);
    });

    expect(result.current.queue).toHaveLength(0);
    expect(result.current.isPlaying).toBe(true);

    await waitFor(() => {
      expect(mockFetchPlayableQueuesForSimilarReleases.mock.calls.length).toBe(
        fetchCountAfterPlay,
      );
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it("does not append similar tracks when extendQueueWithSimilarReleases is disabled", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ extendQueueWithSimilarReleases: false }),
    );
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
      "100002": similarHouseReleaseDetail,
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]?.trackPosition).toBe("B1");
    expect(mockFetchPlayableQueuesForSimilarReleases).not.toHaveBeenCalled();
  });

  it("does not append similar releases when playback starts paused", async () => {
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 100,
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
        master_id: 200,
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
      "100002": similarHouseReleaseDetail,
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([sourceRelease, similarRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: sourceRelease,
        trackPosition: "A1",
        startPaused: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]?.trackPosition).toBe("B1");
  });

  it("appends tracks to the queue without duplicates", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]?.trackPosition).toBe("B1");

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    expect(result.current.queue).toHaveLength(1);
  });

  it("starts playback when adding to an empty queue with autoPlayOnQueueAdd enabled", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ autoPlayOnQueueAdd: true }),
    );

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.autoPlayOnQueueAdd).toBe(true);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "A1",
        trackTitle: "Never Gonna Give You Up",
      });
    });

    await waitFor(() => {
      expect(result.current.isMiniPlayerVisible).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.shouldAutoplayEmbed).toBe(true);
    expect(result.current.queue).toHaveLength(0);
  });

  it("queues without starting playback when autoPlayOnQueueAdd is disabled", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ autoPlayOnQueueAdd: false }),
    );

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.autoPlayOnQueueAdd).toBe(false);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "A1",
        trackTitle: "Never Gonna Give You Up",
      });
    });

    expect(result.current.isMiniPlayerVisible).toBe(false);
    expect(result.current.queue).toHaveLength(1);
  });

  it("advances through a cross-release queue with playNext", async () => {
    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
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

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.release?.basic_information.id).toBe(100002);
      expect(result.current.queue).toHaveLength(0);
    });
  });

  it("keeps autoplay enabled when playNext swaps the playback iframe", async () => {
    setupCollectionAndShortReleaseApiMock();

    const firstIframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;
    const secondIframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
      result.current.registerPlaybackIframe(firstIframe);
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

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
    });

    act(() => {
      result.current.registerPlaybackIframe(null);
      result.current.registerPlaybackIframe(secondIframe);
    });

    expect(result.current.shouldAutoplayEmbed).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(mockLoadAndPlayYoutubeVideo).not.toHaveBeenCalled();
  });

  it("keeps the active track playing when the queue is cleared", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    expect(result.current.queue).toHaveLength(1);

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.queue).toHaveLength(0);
    expect(result.current.canPlayNext).toBe(false);
  });

  it("clears the queue when playback stops", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.stopPlayback();
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it("reorders the queue without restarting the active track", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    setupCollectionAndShortReleaseApiMock();

    act(() => {
      result.current.addToQueue({
        release: shortCollectionRelease,
        trackPosition: "1",
        trackTitle: "Short A",
      });
    });

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.reorderQueue(0, 1);
    });

    expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
      "1",
      "B1",
    ]);
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.isPlaying).toBe(true);
  });

  it("preserves a manually built queue when play is clicked in another release modal", async () => {
    mockUserPreferencesResponse(
      userPreferencesFactory.build({ autoPlayOnQueueAdd: false }),
    );

    setupCollectionAndShortReleaseApiMock();

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

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
      "B1",
      "1",
    ]);
  });

  it("walks back through playback history with playPrevious", async () => {
    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.canPlayPrevious).toBe(true);
    });

    act(() => {
      result.current.playPrevious();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.queue[0]?.trackPosition).toBe("B1");
      expect(result.current.canPlayNext).toBe(true);
    });
  });

  it("uses an explicit youtubeVideoId when switching releases while playback is active", async () => {
    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.playbackVideoId).toBe("te2jJncBVG4");
    });

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        youtubeVideoId: "def98765432",
      });
    });

    expect(result.current.playbackVideoId).toBe("def98765432");
    expect(result.current.embedVideoId).toBe("def98765432");
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPlaybackReady).toBe(true);
  });

  it("loads the new release video when play is clicked in another release modal while playback is active", async () => {
    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.playbackVideoId).toBe("te2jJncBVG4");
    });

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
      });
    });

    await waitFor(() => {
      expect(result.current.playbackVideoId).toBe("def98765432");
      expect(result.current.embedVideoId).toBe("def98765432");
      expect(result.current.activeVideoId).toBe("def98765432");
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });
  });

  it("replaces the album queue when play is clicked without manual queue additions", async () => {
    setupCollectionAndShortReleaseApiMock();

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
        startPaused: true,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
        "B1",
      ]);
    });

    act(() => {
      result.current.startPlayback({
        release: shortCollectionRelease,
        trackPosition: "1",
        startPaused: true,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.queue).toHaveLength(0);
      expect(result.current.release?.basic_information.id).toBe(
        SHORT_RELEASE_ID,
      );
    });
  });
});
