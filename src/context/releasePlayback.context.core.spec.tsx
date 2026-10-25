import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { reportPlaybackSkipToSentry } from "src/lib/sentry/reportPlaybackSkip";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS } from "src/utils/playbackEmbedStartWatchdog";
import { createQueueItem } from "src/utils/playbackQueue";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import { buildStubReleaseForPlaylistTrack } from "src/utils/playlistTrackStubRelease";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { postYoutubePlayerCommand } from "src/utils/releasePlayback";
import {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS,
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
} from "src/utils/releasePlaybackEmbedConfirm";
import {
  readPersistedReleasePlayback,
  toPersistedQueueItem,
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
const mockRequestYoutubeEmbedPlaybackSync = jest.mocked(
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
  createAuthCheckingWrapper,
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

describe("ReleasePlaybackProvider — queue and session", () => {
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

  it("exposes activePlaybackTitle from trackTitle and skips queue building for YouTube-only playlist stubs", () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: null,
      track_title: "Playlist opening",
      youtube_id: "te2jJncBVG4",
    });
    const stubRelease = buildStubReleaseForPlaylistTrack(track);

    if (!stubRelease) {
      throw new Error("expected stub release");
    }

    const { result } = renderHook(() => useReleasePlayback(), {
      wrapper: createWrapper([]),
    });

    act(() => {
      result.current.startPlayback({
        release: stubRelease,
        trackPosition: track.track_position,
        trackTitle: track.track_title,
        ...(track.youtube_id ? { youtubeVideoId: track.youtube_id } : {}),
      });
    });

    expect(result.current.activePlaybackTitle).toBe("A1 - Playlist opening");
    expect(result.current.isQueueBuilding).toBe(false);
  });

  it("updates mini-player metadata when switching to a YouTube-only playlist stub from another release", async () => {
    const mooditaTrack = playlistTrackRowFactory.opening({
      instance_id: "88002",
      track_key: "88002:A1",
      track_title: "Moodita",
      artist: "D I N",
      release_title: "Moodita EP",
      discogs_release_id: null,
      youtube_id: "moodita-youtube-id",
    });
    const mooditaRelease = buildStubReleaseForPlaylistTrack(mooditaTrack);

    if (!mooditaRelease) {
      throw new Error("expected moodita stub release");
    }

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
      expect(result.current.activePlaybackTitle).toBeTruthy();
    });

    act(() => {
      result.current.startPlayback({
        release: mooditaRelease,
        trackPosition: mooditaTrack.track_position,
        trackTitle: mooditaTrack.track_title,
        ...(mooditaTrack.youtube_id
          ? { youtubeVideoId: mooditaTrack.youtube_id }
          : {}),
        rebuildAlbumQueue: false,
      });
    });

    expect(result.current.release?.instance_id).toBe(
      mooditaRelease.instance_id,
    );
    expect(result.current.activePlaybackTitle).toBe("A1 - Moodita");
    expect(result.current.embedVideoId).toBe("moodita-youtube-id");
    expect(result.current.release?.basic_information.artists[0]?.name).toBe(
      "D I N",
    );
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
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 2,
      });
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    expect(result.current.isPaused).toBe(false);
  });

  it("does not skip a new release track when embed playing confirms before the load delay elapses", async () => {
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
        youtubeVideoId: "def98765432",
      });
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(false);
      expect(result.current.activeTrackPosition).toBe("1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
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
      dispatchYoutubePlayerState({
        contentWindow,
        playerState: 1,
      });
    });

    act(() => {
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS -
          EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
      );
    });

    expect(result.current.activeTrackPosition).toBe("1");
    expect(result.current.release?.basic_information.id).toBe(SHORT_RELEASE_ID);
    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("polls requestYoutubeEmbedPlaybackSync while playback video UI is loading on a visible tab", async () => {
    jest.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

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

    act(() => {
      result.current.playNext();
    });

    await waitFor(() => {
      expect(result.current.activeTrackPosition).toBe("B1");
      expect(result.current.isPlaybackVideoLoading).toBe(true);
    });

    mockRequestYoutubeEmbedPlaybackSync.mockClear();

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS);
    });

    expect(mockRequestYoutubeEmbedPlaybackSync).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS);
    });

    expect(mockRequestYoutubeEmbedPlaybackSync).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
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
        tracklist: Array.from({ length: 10 }, (_, index) =>
          discogsTrackFactory.build({
            position: String(index + 1),
            title: `Track ${index + 1}`,
            duration: "3:00",
            type_: "track",
          }),
        ),
        videos: [
          discogsVideoFactory.youtube({
            description: "Track video",
            duration: 180,
            title: "Track 1",
            uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
          }),
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
          discogsTrackFactory.build({
            position: "1",
            title: "Short A",
            duration: "2:00",
            type_: "track",
          }),
          discogsTrackFactory.build({
            position: "2",
            title: "Short B",
            duration: "2:30",
            type_: "track",
          }),
          discogsTrackFactory.build({
            position: "3",
            title: "Short C",
            duration: "3:00",
            type_: "track",
          }),
        ],
        videos: [
          discogsVideoFactory.youtube({
            description: "Short C",
            duration: 180,
            title: "Short C",
            uri: "https://www.youtube.com/watch?v=xyz98765432",
          }),
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
    expect(result.current.isPlaybackVideoLoading).toBe(false);
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
      youtubeVideoId: "te2jJncBVG4",
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

  it("queues without losing transport when adding after clearQueue while playback stays active", async () => {
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
      result.current.clearQueue();
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
      expect(result.current.canPlayNext).toBe(true);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.queue).toHaveLength(1);
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

  it("replaceUpcomingQueue swaps upcoming tracks without restarting the active track", async () => {
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
      expect(result.current.queue).toHaveLength(1);
    });

    act(() => {
      result.current.addToQueue({
        release: collectionRelease,
        trackPosition: "B1",
        trackTitle: "Never Gonna Give You Up (Instrumental)",
      });
    });

    expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
      "B1",
    ]);

    const replacement = createQueueItem({
      release: shortCollectionRelease,
      trackPosition: "1",
      trackTitle: "Short A",
    });

    act(() => {
      result.current.replaceUpcomingQueue([replacement]);
    });

    expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
      "1",
    ]);
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.isPlaying).toBe(true);
  });

  it("when release detail resolves after manual queue curation, keeps the active track and does not unavailable-skip", async () => {
    setupCollectionAndShortReleaseApiMock();

    let resolveReleaseDetail!: (value: typeof releaseDetail) => void;
    const releaseDetailPromise = new Promise<typeof releaseDetail>(
      (resolve) => {
        resolveReleaseDetail = resolve;
      },
    );

    jest
      .mocked(mockApi.discogsRelease)
      .mockImplementation(() => releaseDetailPromise);

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
      });
      result.current.registerPlaybackIframe(iframe);
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

    expect(result.current.queue.map((item) => item.trackPosition)).toEqual([
      "B1",
      "1",
    ]);

    act(() => {
      result.current.reorderQueue(0, 1);
    });

    expect(result.current.isQueueBuilding).toBe(true);

    const curatedQueueOrder = result.current.queue.map(
      (item) => item.trackPosition,
    );

    await act(async () => {
      resolveReleaseDetail(releaseDetail);
    });

    await waitFor(() => {
      expect(result.current.isQueueBuilding).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.queue.map((item) => item.trackPosition)).toEqual(
        curatedQueueOrder,
      );
    });

    await waitFor(() => {
      expect(result.current.isPlaybackReady).toBe(true);
    });

    act(() => {
      dispatchYoutubePlayerState({
        contentWindow: iframe.contentWindow as Window,
        playerState: 1,
      });
    });

    mockAppendPlaybackSkipAndSchedule.mockClear();

    jest.useFakeTimers();

    act(() => {
      jest.advanceTimersByTime(
        PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS +
          PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
      );
    });

    expect(mockAppendPlaybackSkipAndSchedule).not.toHaveBeenCalled();
    expect(result.current.activeTrackPosition).toBe("A1");
    expect(result.current.isPlaying).toBe(true);

    jest.useRealTimers();
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
