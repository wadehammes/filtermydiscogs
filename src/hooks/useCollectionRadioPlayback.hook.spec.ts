import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { act, renderFeatureHook, waitFor } from "test-utils";

const mockStartPlayback = jest.fn();
const mockClearQueue = jest.fn();

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlaybackActions: () => ({
    startPlayback: mockStartPlayback,
    clearQueue: mockClearQueue,
    addToQueue: jest.fn(),
  }),
  useReleasePlaybackState: () => ({
    isPlaying: false,
    isPaused: false,
    queueAutopopulateSource: null,
  }),
}));

const mockShowPlaybackQueueSuccessToast = jest.fn();
const mockShowPlaybackQueueNoTracksToast = jest.fn();

jest.mock("src/utils/playbackQueueToast", () => ({
  showPlaybackQueueSuccessToast: (...args: unknown[]) =>
    mockShowPlaybackQueueSuccessToast(...args),
  showPlaybackQueueNoTracksToast: (...args: unknown[]) =>
    mockShowPlaybackQueueNoTracksToast(...args),
  showPlaybackQueueFetchErrorToast: jest.fn(),
}));

jest.mock("src/api/urls");

const filteredRelease = releaseFactory.withDisplayDefaults({
  instance_id: 9001,
  basic_information: { id: 249504, title: "Test Album" },
});
const secondFilteredRelease = releaseFactory.withDisplayDefaults({
  instance_id: 9002,
  basic_information: { id: 249505, title: "Second Album" },
});

let mockSortedFilteredReleases: DiscogsRelease[] = [filteredRelease];

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useSortedFilteredReleases: () => mockSortedFilteredReleases,
}));

jest.mock("src/hooks/useFilterViews.hook");

const hydrationQueryState = {
  isSuccess: false,
  isFetching: false,
  isPending: false,
};

jest.mock("src/hooks/useHydrateDiscogsReleaseDetails.hook", () => ({
  useHydrateDiscogsReleaseDetails: () => hydrationQueryState,
}));

const mockApi = jest.mocked(api);
const queryClient = createTestQueryClient();

import { useCollectionRadioPlayback } from "src/hooks/useCollectionRadioPlayback.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";

const seedRadioReleaseDetailsInCache = (
  releaseIds: string[] = ["249504", "249505"],
) => {
  const detailsById: Record<string, DiscogsReleaseDetail> = {
    "249504": defaultReleaseDetail,
    "249505": discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249505 }),
  };

  for (const releaseId of releaseIds) {
    const detail = detailsById[releaseId];
    if (detail) {
      queryClient.setQueryData(
        discogsReleaseQueryOptions(releaseId).queryKey,
        detail,
      );
    }
  }
};

const renderCollectionRadioHook = () =>
  renderFeatureHook(() => useCollectionRadioPlayback(), {
    queryClient,
    authInitialState: testAuthenticatedAuthState,
    includeCollectionSync: false,
  });

const defaultReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: 249504,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useFilterViews).mockReturnValue({
    hasActiveFilters: true,
    matchingView: null,
  } as ReturnType<typeof useFilterViews>);
  Object.assign(mockApi, {
    discogsRelease: jest.fn(),
    discogsReleaseBatch: jest.fn(),
  });
  mockSortedFilteredReleases = [filteredRelease];
  queryClient.clear();

  setupFetchDiscogsReleaseMock(mockApi, defaultReleaseDetail, {
    "249504": defaultReleaseDetail,
    "249505": discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249505 }),
  });

  hydrationQueryState.isSuccess = false;
  hydrationQueryState.isFetching = false;
  hydrationQueryState.isPending = true;
});

const markRadioDetailsReady = (rerender: () => void, releaseIds?: string[]) => {
  seedRadioReleaseDetailsInCache(releaseIds);
  hydrationQueryState.isSuccess = true;
  hydrationQueryState.isFetching = false;
  hydrationQueryState.isPending = false;
  rerender();
};

const waitForRadioDetailsReady = (
  result: { current: ReturnType<typeof useCollectionRadioPlayback> },
  rerender: () => void,
  releaseIds?: string[],
) => {
  markRadioDetailsReady(rerender, releaseIds);
  expect(result.current.isDetailsReady).toBe(true);
};

describe("useCollectionRadioPlayback", () => {
  it("starts playback with a shuffled queue of playable tracks from filtered releases", async () => {
    const { result, rerender } = renderCollectionRadioHook();

    expect(result.current.filteredReleaseCount).toBe(1);

    waitForRadioDetailsReady(result, rerender);
    act(() => {
      result.current.startCollectionRadio();
    });

    await waitFor(() => {
      expect(result.current.isCollectionRadioSession).toBe(true);
    });

    expect(mockClearQueue).toHaveBeenCalledWith();
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A",
        rebuildAlbumQueue: false,
        startPaused: false,
        startQueueItem: expect.objectContaining({
          fromCollectionRadio: true,
          trackPosition: "A",
        }),
        release: expect.objectContaining({
          tracklist: expect.any(Array),
          videos: expect.any(Array),
        }),
      }),
    );
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.not.objectContaining({
        youtubeVideoId: expect.anything(),
      }),
    );
    expect(result.current.isCollectionRadioSelectionStale).toBe(false);
    expect(mockShowPlaybackQueueSuccessToast).toHaveBeenCalled();
  });

  it("marks the session stale and allows restart when the filtered release set changes", async () => {
    const { result, rerender } = renderCollectionRadioHook();

    waitForRadioDetailsReady(result, rerender);
    act(() => {
      result.current.startCollectionRadio();
    });
    expect(mockStartPlayback).toHaveBeenCalledTimes(1);

    mockSortedFilteredReleases = [filteredRelease, secondFilteredRelease];
    rerender();

    await waitFor(() => {
      expect(result.current.isCollectionRadioSelectionStale).toBe(true);
    });
    waitForRadioDetailsReady(result, rerender, ["249504", "249505"]);
    act(() => {
      result.current.startCollectionRadio();
    });

    expect(mockStartPlayback).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(result.current.isCollectionRadioSelectionStale).toBe(false);
    });
  });

  it("includes playable tracks from every filtered release in the upcoming queue", async () => {
    mockSortedFilteredReleases = [filteredRelease, secondFilteredRelease];

    const { result, rerender } = renderCollectionRadioHook();

    waitForRadioDetailsReady(result, rerender, ["249504", "249505"]);
    result.current.startCollectionRadio();

    const startCall = mockStartPlayback.mock.calls[0]?.[0] as {
      upcomingQueue?: PlaybackQueueItem[];
      release: DiscogsRelease;
    };
    const instanceIds = new Set([
      String(startCall.release.instance_id),
      ...(startCall.upcomingQueue?.map((item) => item.instanceId) ?? []),
    ]);

    expect(instanceIds).toEqual(new Set(["9001", "9002"]));
  });

  it("shows a no-tracks toast when no filtered releases are playable", async () => {
    const emptyDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      tracklist: [],
      videos: [],
    });

    setupFetchDiscogsReleaseMock(mockApi, emptyDetail, {
      "249504": emptyDetail,
    });
    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      emptyDetail,
    );

    const { result, rerender } = renderCollectionRadioHook();

    hydrationQueryState.isSuccess = true;
    hydrationQueryState.isFetching = false;
    hydrationQueryState.isPending = false;
    rerender();

    expect(result.current.isDetailsReady).toBe(true);
    act(() => {
      result.current.startCollectionRadio();
    });

    expect(mockShowPlaybackQueueNoTracksToast).toHaveBeenCalledTimes(1);
    expect(mockStartPlayback).not.toHaveBeenCalled();
  });

  it("does not start playback until release details are cached", () => {
    const { result } = renderCollectionRadioHook();

    result.current.startCollectionRadio();

    expect(mockStartPlayback).not.toHaveBeenCalled();
  });
});
