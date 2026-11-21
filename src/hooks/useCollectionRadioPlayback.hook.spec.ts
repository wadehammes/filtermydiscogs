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

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useSortedFilteredReleases: () => [filteredRelease],
}));

const mockSetCollectionRadioSession = jest.fn();

jest.mock("jotai", () => {
  const actual = jest.requireActual<typeof import("jotai")>("jotai");
  return {
    ...actual,
    useSetAtom: () => mockSetCollectionRadioSession,
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

describe("useCollectionRadioPlayback", () => {
  it("starts playback on the first filtered release with playable tracks", async () => {
    const { result } = renderCollectionRadioHook();

    await result.current.startCollectionRadio();

    await waitFor(() => {
      expect(mockStartPlayback).toHaveBeenCalled();
    });

    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A",
        rebuildAlbumQueue: false,
        startPaused: false,
      }),
    );
    expect(mockShowPlaybackQueueSuccessToast).toHaveBeenCalled();
    expect(mockSetCollectionRadioSession).toHaveBeenCalled();
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

    await result.current.startCollectionRadio();

    await waitFor(() => {
      expect(mockShowPlaybackQueueNoTracksToast).toHaveBeenCalledTimes(1);
    });
    expect(mockStartPlayback).not.toHaveBeenCalled();
  });
});
