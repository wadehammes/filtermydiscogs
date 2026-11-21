import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  useReleasePlayback,
  useReleasePlaybackEmbedProgressState,
} from "src/context/releasePlayback.context";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  listPlayableTrackQueueItemsFromDetail,
  markCollectionRadioQueueItems,
} from "src/utils/collectionRadioPlayback";
import { PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS } from "src/utils/playbackEmbedStartWatchdog";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/similarReleaseQueue", () => ({
  fetchPlayableQueuesForSimilarReleases: jest.fn(),
}));
jest.mock("src/utils/postYoutubePlayerCommand");
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
const mockAppendPlaybackSkipAndSchedule = jest.mocked(
  appendPlaybackSkipAndSchedule,
);

import {
  collectionRelease,
  createWrapper,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  releaseDetail,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
  shortReleaseDetail,
} from "src/context/releasePlayback.context.spec.harness";

const usePlaybackWithEmbedProgress = () => {
  const playback = useReleasePlayback();
  const { embedProgress } = useReleasePlaybackEmbedProgressState();

  return { ...playback, embedProgress };
};

const buildCollectionRadioPlanStartingAtB1 = () => {
  const pool = markCollectionRadioQueueItems([
    ...listPlayableTrackQueueItemsFromDetail(collectionRelease, releaseDetail),
    ...listPlayableTrackQueueItemsFromDetail(
      shortCollectionRelease,
      shortReleaseDetail,
    ),
  ]);
  const startItem = pool.find(
    (item) =>
      item.trackPosition === "B1" &&
      String(item.release.instance_id) ===
        String(collectionRelease.instance_id),
  );

  if (!startItem) {
    throw new Error("Expected collection radio pool to include track B1");
  }

  const upcomingItems = pool.filter((item) => item !== startItem);

  return { startItem, upcomingItems };
};

describe("ReleasePlaybackProvider — collection radio", () => {
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
    setupCollectionAndShortReleaseApiMock();
    setDocumentVisibilityState("visible");
  });

  it("when transport was on another track on the same album, starting collection radio confirms playback and advances embed progress without watchdog skip", async () => {
    jest.useFakeTimers();

    const contentWindow = { postMessage: jest.fn() } as unknown as Window;
    const iframe = { contentWindow } as unknown as HTMLIFrameElement;
    const { startItem, upcomingItems } = buildCollectionRadioPlanStartingAtB1();

    const { result } = renderHook(() => usePlaybackWithEmbedProgress(), {
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

    mockAppendPlaybackSkipAndSchedule.mockClear();

    act(() => {
      result.current.clearQueue();
      result.current.startPlayback({
        release: startItem.release,
        trackPosition: startItem.trackPosition,
        trackTitle: startItem.trackTitle,
        startQueueItem: startItem,
        rebuildAlbumQueue: false,
        upcomingQueue: upcomingItems,
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaying).toBe(true);
    });

    act(() => {
      result.current.notifyPlaybackVideoLoadStarted("abc12345678");
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
      dispatchYoutubeInfoDelivery({
        contentWindow,
        info: { currentTime: 1.2, duration: 330, playerState: 1 },
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackVideoLoading).toBe(false);
      expect(
        result.current.embedProgress?.currentTime ?? 0,
      ).toBeGreaterThanOrEqual(1);
    });

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS);
    });

    expect(result.current.activeTrackPosition).toBe("B1");
    expect(startItem.fromCollectionRadio).toBe(true);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
