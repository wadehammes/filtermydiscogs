import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userTrackStatsResponseFactory } from "src/tests/factories/UserTrackStatsResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
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
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
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
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  RELEASE_ID,
  releaseDetail,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — overrides", () => {
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

  it("prefers a user YouTube override over the Discogs-matched video for active playback ids", async () => {
    const overrideVideoId = "overrid1234";
    const trackKey = `${collectionRelease.instance_id}:A1`;

    mockApiResponse(
      true,
      mockApi.fetchTrackStats,
      userTrackStatsResponseFactory.build({
        stats: {
          [trackKey]: {
            play_count: 0,
            listen_count: 0,
            youtube_id: overrideVideoId,
          },
        },
      }),
      new Error("Track stats API request failed"),
    );

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

    expect(result.current.activeVideoId).toBe(overrideVideoId);
    expect(result.current.playbackVideoId).toBe(overrideVideoId);
    expect(result.current.isPlaying).toBe(true);
    expect(mockApi.fetchTrackStats).toHaveBeenCalled();
  });

  it("when the queue grows during user override playback, keeps the override video id and does not unavailable-skip", async () => {
    jest.useFakeTimers();
    setupCollectionAndShortReleaseApiMock();

    const overrideVideoId = "overrid1234";
    const trackKey = `${collectionRelease.instance_id}:A1`;
    const queuedTrackKey = `${shortCollectionRelease.instance_id}:1`;

    const initialStats = userTrackStatsResponseFactory.build({
      stats: {
        [trackKey]: {
          play_count: 0,
          listen_count: 0,
          youtube_id: overrideVideoId,
        },
      },
    });

    let resolveExpandedFetch!: (
      value: ReturnType<typeof userTrackStatsResponseFactory.build>,
    ) => void;
    const expandedFetchPromise = new Promise<
      ReturnType<typeof userTrackStatsResponseFactory.build>
    >((resolve) => {
      resolveExpandedFetch = resolve;
    });

    mockApi.fetchTrackStats.mockImplementation((keys: string[]) => {
      if (keys.length === 1 && keys[0] === trackKey) {
        return Promise.resolve(initialStats);
      }

      return expandedFetchPromise;
    });

    const iframe = {
      contentWindow: { postMessage: jest.fn() },
    } as unknown as HTMLIFrameElement;

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([collectionRelease, shortCollectionRelease]),
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
      expect(result.current.activeVideoId).toBe(overrideVideoId);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow: iframe.contentWindow as Window,
        playerState: 1,
      });
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.addToQueue({
        release: shortCollectionRelease,
        trackPosition: "1",
        trackTitle: "Short A",
      });
    });

    await waitFor(() => {
      expect(mockApi.fetchTrackStats.mock.calls.length).toBeGreaterThan(1);
      expect(result.current.activeVideoId).toBe(overrideVideoId);
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    await act(async () => {
      resolveExpandedFetch(
        userTrackStatsResponseFactory.build({
          stats: {
            [trackKey]: {
              play_count: 0,
              listen_count: 0,
              youtube_id: overrideVideoId,
            },
            [queuedTrackKey]: {
              play_count: 0,
              listen_count: 0,
              youtube_id: null,
            },
          },
        }),
      );
    });

    jest.useRealTimers();
  });

  it("restores an override-only track after refresh using the persisted youtubeVideoId", async () => {
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
      instance_id: "restore-override-instance",
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Override Album",
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, overrideOnlyDetail);

    writePersistedReleasePlayback({
      instanceId: String(overrideCollectionRelease.instance_id),
      trackPosition: "A1",
      youtubeVideoId: overrideVideoId,
    });

    mockApi.fetchTrackStats.mockRejectedValue(
      new Error("Track stats unavailable"),
    );

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([overrideCollectionRelease]),
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.activeTrackPosition).toBe("A1");
      expect(result.current.playbackVideoId).toBe(overrideVideoId);
      expect(result.current.activeVideoId).toBe(overrideVideoId);
      expect(result.current.isPlaybackReady).toBe(true);
    });
  });

  it("persists youtubeVideoId while playing an override-only track for restore", async () => {
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
      instance_id: "persist-override-instance",
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Override Album",
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });

    setupFetchDiscogsReleaseMock(mockApi, overrideOnlyDetail);

    const { result, unmount } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([overrideCollectionRelease]),
    });

    act(() => {
      result.current.startPlayback({
        release: overrideCollectionRelease,
        trackPosition: "A1",
        youtubeVideoId: overrideVideoId,
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(readPersistedReleasePlayback()?.youtubeVideoId).toBe(
        overrideVideoId,
      );
    });

    unmount();

    mockApi.fetchTrackStats.mockRejectedValue(
      new Error("Track stats unavailable"),
    );

    const { result: restored } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([overrideCollectionRelease]),
    });

    await waitFor(() => {
      expect(restored.current.activeTrackPosition).toBe("A1");
      expect(restored.current.playbackVideoId).toBe(overrideVideoId);
      expect(restored.current.isPaused).toBe(true);
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
});
