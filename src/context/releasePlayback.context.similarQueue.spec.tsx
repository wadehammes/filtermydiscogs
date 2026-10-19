import { beforeEach, describe, expect, it } from "@jest/globals";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { createQueueItem } from "src/utils/playbackQueue";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
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
const _mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);
const _mockReportPlaybackSkipToSentry = jest.mocked(reportPlaybackSkipToSentry);

import {
  createWrapper,
  mockApi,
  mockUserPreferencesResponse,
  RELEASE_ID,
  releaseDetail,
  SHORT_RELEASE_ID,
  shortReleaseDetail,
  similarHouseReleaseDetail,
} from "src/context/releasePlayback.context.spec.harness";

describe("ReleasePlaybackProvider — similar queue", () => {
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
});
