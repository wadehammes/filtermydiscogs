import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { createQueueItem } from "src/utils/playbackQueue";
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
const mockLoadAndPlayYoutubeVideo = jest.mocked(loadAndPlayYoutubeVideo);
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
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  releaseDetail,
  SHORT_RELEASE_ID,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — queue advance", () => {
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

  it("playNext uses queue item YouTube id and UserTrack artist for mini-player metadata", async () => {
    setupCollectionAndShortReleaseApiMock();

    const mooditaItem = createQueueItem({
      release: shortCollectionRelease,
      trackPosition: "1",
      trackTitle: "Moodita",
      youtubeVideoId: "moodita-yt-id",
      artist: "D I N",
    });

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: collectionRelease,
        trackPosition: "A1",
        trackTitle: "Gaia",
        youtubeVideoId: "gaia-yt-id",
        artist: "Janeret & Miroloja",
        rebuildAlbumQueue: false,
        upcomingQueue: [mooditaItem],
      });
    });

    await waitFor(() => {
      expect(result.current.activePlaybackTitle).toBe("A1 - Gaia");
      expect(result.current.activePlaybackArtist).toBe("Janeret & Miroloja");
    });

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activePlaybackTitle).toBe("1 - Moodita");
      expect(result.current.activePlaybackArtist).toBe("D I N");
      expect(result.current.embedVideoId).toBe("moodita-yt-id");
    });
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
});
