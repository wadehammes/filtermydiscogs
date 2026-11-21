import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { renderFeatureHook, waitFor } from "test-utils";

const mockStartPlayback = jest.fn();
const mockClearQueue = jest.fn();

const playbackSession = {
  isMiniPlayerVisible: false,
  isPlaying: false,
  autoPlayOnQueueAdd: true,
  release: null as DiscogsRelease | null,
  activeTrackPosition: null as string | null,
  isReleasePreview: false,
  queue: [] as PlaybackQueueItem[],
};

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlayback: () => ({
    startPlayback: mockStartPlayback,
    clearQueue: mockClearQueue,
    addToQueue: jest.fn(),
    ...playbackSession,
  }),
  useReleasePlaybackState: () => ({
    isPlaying: false,
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

jest.mock("src/api/urls", () => ({
  api: {
    discogsRelease: jest.fn(),
  },
}));

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

jest.mock("src/hooks/useFilterViews.hook", () => ({
  useFilterViews: () => ({
    hasActiveFilters: true,
    matchingView: null,
  }),
}));

const mockSetCollectionRadioActive = jest.fn();

jest.mock("jotai", () => {
  const actual = jest.requireActual<typeof import("jotai")>("jotai");
  return {
    ...actual,
    useAtom: () => [false, mockSetCollectionRadioActive],
  };
});

const mockApi = jest.mocked(api);
const queryClient = createTestQueryClient();
const discogsReleaseApiError = new Error("Discogs release fetch failed");

let useCollectionRadioPlayback: typeof import("src/hooks/useCollectionRadioPlayback.hook")["useCollectionRadioPlayback"];

const renderCollectionRadioHook = () =>
  renderFeatureHook(() => useCollectionRadioPlayback(), {
    queryClient,
    authInitialState: testAuthenticatedAuthState,
    includeCollectionSync: false,
  });

beforeEach(async () => {
  jest.clearAllMocks();
  mockSortedFilteredReleases = [filteredRelease];
  queryClient.clear();
  useCollectionRadioPlayback = (
    await import("src/hooks/useCollectionRadioPlayback.hook")
  ).useCollectionRadioPlayback;

  mockApiResponse(
    true,
    mockApi.discogsRelease,
    discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    discogsReleaseApiError,
  );
});

const waitForRadioDetailsReady = async (result: {
  current: ReturnType<typeof useCollectionRadioPlayback>;
}) => {
  await waitFor(() => {
    expect(result.current.isDetailsReady).toBe(true);
  });
};

describe("useCollectionRadioPlayback", () => {
  it("starts playback with a shuffled queue of playable tracks from filtered releases", async () => {
    const { result } = renderCollectionRadioHook();

    await waitForRadioDetailsReady(result);
    result.current.startCollectionRadio();

    expect(mockClearQueue).toHaveBeenCalledWith();
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A",
        rebuildAlbumQueue: false,
        startPaused: false,
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
    expect(mockSetCollectionRadioActive).toHaveBeenCalledWith(true);
    expect(mockShowPlaybackQueueSuccessToast).toHaveBeenCalled();
  });

  it("includes playable tracks from every filtered release in the upcoming queue", async () => {
    mockSortedFilteredReleases = [filteredRelease, secondFilteredRelease];

    mockApiResponse(
      [true, true],
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      discogsReleaseApiError,
    );

    const { result } = renderCollectionRadioHook();

    await waitForRadioDetailsReady(result);
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
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: 249504,
        tracklist: [],
        videos: [],
      }),
      discogsReleaseApiError,
    );

    const { result } = renderCollectionRadioHook();

    await waitForRadioDetailsReady(result);
    result.current.startCollectionRadio();

    expect(mockShowPlaybackQueueNoTracksToast).toHaveBeenCalledTimes(1);
    expect(mockStartPlayback).not.toHaveBeenCalled();
  });

  it("does not start playback until release details are cached", () => {
    const { result } = renderCollectionRadioHook();

    result.current.startCollectionRadio();

    expect(mockStartPlayback).not.toHaveBeenCalled();
  });
});
