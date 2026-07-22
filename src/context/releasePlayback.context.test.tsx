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
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/hooks/queries/useDiscogsReleaseQuery");
jest.mock("src/api/helpers");

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
