import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import * as apiHelpers from "src/api/helpers";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupDiscogsReleaseQueryMock } from "src/tests/mocks/setupDiscogsReleaseQueryMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { DiscogsRelease } from "src/types";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/hooks/queries/useDiscogsReleaseQuery");
jest.mock("src/api/helpers");
jest.mock("src/utils/releasePlayback", () => ({
  ...jest.requireActual("src/utils/releasePlayback"),
  postYoutubePlayerCommand: jest.fn(),
}));

const mockPostYoutubePlayerCommand = jest.mocked(postYoutubePlayerCommand, {
  shallow: true,
});

const mockApi = jest.mocked(apiHelpers);

const RELEASE_ID = 249504;

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_ID,
  tracklist: [
    {
      position: "A1",
      title: "Never Gonna Give You Up",
      duration: "3:32",
      type_: "track",
    },
    {
      position: "B1",
      title: "Never Gonna Give You Up (Instrumental)",
      duration: "3:30",
      type_: "track",
    },
  ],
});

const collectionRelease = releaseFactory.withDisplayDefaults({
  basic_information: basicInformationFactory.build({
    id: RELEASE_ID,
    title: "Never Gonna Give You Up",
    resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
  }),
});

const SeedCollectionReleases = ({
  releases,
  collectionPage = 1,
  collectionTotalPages = 1,
  children,
}: {
  releases: DiscogsRelease[];
  collectionPage?: number;
  collectionTotalPages?: number;
  children: ReactNode;
}) => {
  const { dispatchFetchingCollection, dispatchCollection } =
    useCollectionContext();
  const filtersDispatch = useFiltersDispatch();

  useLayoutEffect(() => {
    dispatchFetchingCollection(false);
    dispatchCollection(
      collectionFactory.build(
        { releases },
        { page: collectionPage, totalPages: collectionTotalPages },
      ),
    );
    filtersDispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: releases,
    });
  }, [
    collectionPage,
    collectionTotalPages,
    dispatchCollection,
    dispatchFetchingCollection,
    filtersDispatch,
    releases,
  ]);

  return children;
};

const createWrapper = (
  releases: DiscogsRelease[] = [],
  collectionOptions?: {
    collectionPage?: number;
    collectionTotalPages?: number;
  },
) => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders authInitialState={testAuthenticatedAuthState}>
      <SeedCollectionReleases releases={releases} {...collectionOptions}>
        <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
      </SeedCollectionReleases>
    </TestProviders>
  );
};

const createAuthCheckingWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders
      authInitialState={{
        ...testAuthenticatedAuthState,
        isCheckingAuth: true,
      }}
    >
      <SeedCollectionReleases releases={[collectionRelease]}>
        <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
      </SeedCollectionReleases>
    </TestProviders>
  );
};

describe("ReleasePlaybackProvider", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    mockPostYoutubePlayerCommand.mockClear();
    setupDefaultCrateApiMocks(mockApi);
    setupDiscogsReleaseQueryMock(releaseDetail);
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
      jest.advanceTimersByTime(800);
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

    jest
      .mocked(useDiscogsReleaseQuery)
      .mockImplementation(({ enabled, releaseId }) => {
        if (!enabled) {
          return {
            data: undefined,
            isLoading: false,
            isError: false,
            refetch: jest.fn(),
          } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
        }

        const detail =
          releaseId === "100002"
            ? discogsReleaseJsonFactory.withTracklistAndVideos({
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
              })
            : longTracklistRelease;

        return {
          data: {
            ...detail,
            id: Number(releaseId) || detail.id,
          },
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
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
        trackPosition: "10",
      });
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("10");
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

  it("waits for the collection to load before giving up restore", () => {
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
});
