import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { api } from "src/api/urls";
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
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { DiscogsRelease } from "src/types";
import { createQueueItem } from "src/utils/playbackQueue";
import { requestYoutubePlayerState } from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import {
  readPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  transitionYoutubeIframeToVideo: jest.fn(),
  requestYoutubePlayerState: jest.fn(),
}));

const mockPostYoutubePlayerCommand = jest.mocked(postYoutubePlayerCommand);
const mockRequestYoutubePlayerState = jest.mocked(requestYoutubePlayerState);

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
};

const dispatchYoutubePlayerState = ({
  contentWindow,
  playerState,
  event = "onStateChange",
}: {
  contentWindow: Window;
  playerState: number;
  event?: "onStateChange" | "infoDelivery";
}) => {
  const data =
    event === "infoDelivery"
      ? JSON.stringify({
          event: "infoDelivery",
          info: { playerState },
        })
      : JSON.stringify({ event: "onStateChange", info: playerState });

  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      origin: "https://www.youtube-nocookie.com",
      source: contentWindow,
    }),
  );
};

const mockApi = jest.mocked(api);
const preferencesApiError = new Error("Preferences API request failed");

const mockUserPreferencesResponse = (
  preferences = userPreferencesFactory.defaults(),
) => {
  mockApiResponse(
    true,
    mockApi.userPreferences,
    { preferences },
    preferencesApiError,
  );
};

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
  videos: [
    {
      description: "Rick Astley - Never Gonna Give You Up",
      duration: 330,
      embed: true,
      title: "Rick Astley - Never Gonna Give You Up",
      uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
    },
    {
      description: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      duration: 330,
      embed: true,
      title: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      uri: "https://www.youtube.com/watch?v=abc12345678",
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

const SHORT_RELEASE_ID = 100002;

const shortReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: SHORT_RELEASE_ID,
  tracklist: [
    {
      position: "1",
      title: "Short A",
      duration: "2:00",
      type_: "track",
    },
  ],
  videos: [
    {
      description: "Short A",
      duration: 120,
      embed: true,
      title: "Short A",
      uri: "https://www.youtube.com/watch?v=def98765432",
    },
  ],
});

const shortCollectionRelease = releaseFactory.withDisplayDefaults({
  basic_information: basicInformationFactory.build({
    id: SHORT_RELEASE_ID,
    title: "Short EP",
    resource_url: `https://api.discogs.com/releases/${SHORT_RELEASE_ID}`,
  }),
});

const similarHouseReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos({
    id: 100002,
    tracklist: [
      {
        position: "A1",
        title: "Similar Track",
        duration: "4:00",
        type_: "track",
      },
    ],
    videos: [
      {
        description: "Similar Track",
        duration: 240,
        embed: true,
        title: "Similar Track",
        uri: "https://www.youtube.com/watch?v=similar12345",
      },
    ],
  });

const setupCollectionAndShortReleaseApiMock = () => {
  setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
    [String(SHORT_RELEASE_ID)]: shortReleaseDetail,
  });
};

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
    <TestProviders
      authInitialState={testAuthenticatedAuthState}
      includeCollectionSync={false}
    >
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
      includeCollectionSync={false}
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
    expect(
      mockPostYoutubePlayerCommand.mock.calls.some(
        ([args]) => args.command === "playVideo" && args.iframe === iframe,
      ),
    ).toBe(true);

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

  it("polls player state while the document is hidden during playback", async () => {
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
    });

    mockRequestYoutubePlayerState.mockClear();
    mockPostYoutubePlayerCommand.mockClear();

    act(() => {
      setDocumentVisibilityState("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRequestYoutubePlayerState).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(mockRequestYoutubePlayerState).toHaveBeenCalledTimes(2);
    expect(
      mockPostYoutubePlayerCommand.mock.calls.some(
        ([args]) => args.command === "playVideo" && args.iframe === iframe,
      ),
    ).toBe(true);

    jest.useRealTimers();
  });

  it("requests player state when the tab becomes visible again", async () => {
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

    mockRequestYoutubePlayerState.mockClear();

    act(() => {
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRequestYoutubePlayerState.mock.calls[0]?.[0]).toBe(iframe);
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
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 2 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 1 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    expect(result.current.isPaused).toBe(false);
  });

  it("ignores embed pause while the document is hidden and still advances the queue on end", async () => {
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
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 2 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    expect(result.current.isPaused).toBe(false);

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

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
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

    mockRequestYoutubePlayerState.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRequestYoutubePlayerState).toHaveBeenCalledTimes(1);
    expect(mockRequestYoutubePlayerState.mock.calls[0]?.[0]).toBe(iframe);

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

  it("appends playable tracks from similar releases when playback starts", async () => {
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
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
      expect(result.current.queue).toHaveLength(2);
    });

    expect(result.current.queue[1]?.instanceId).toBe(
      similarRelease.instance_id,
    );
    expect(result.current.queue[1]?.trackPosition).toBe("A1");
  });

  it("does not append similar releases when playback starts paused", async () => {
    const sourceRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: RELEASE_ID,
        title: "Never Gonna Give You Up",
        genres: ["Electronic"],
        styles: ["House"],
        resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
      }),
    });
    const similarRelease = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Similar House EP",
        genres: ["Electronic"],
        styles: ["House"],
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
