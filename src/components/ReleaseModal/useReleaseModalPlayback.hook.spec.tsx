import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import { api } from "src/api/urls";
import { useReleaseModalPlayback } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const RELEASE_ID = 249504;
const OTHER_RELEASE_ID = 100002;

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_ID,
});

const otherReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: OTHER_RELEASE_ID,
  title: "Other Album",
  tracklist: [
    {
      position: "A1",
      title: "Modal Track One",
      duration: "4:00",
      type_: "track",
    },
    {
      position: "A2",
      title: "Modal Track Two",
      duration: "3:45",
      type_: "track",
    },
  ],
  videos: [
    {
      description: "Modal Track One",
      duration: 240,
      embed: true,
      title: "Modal Track One",
      uri: "https://www.youtube.com/watch?v=modalTrackOne1",
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

const otherCollectionRelease = releaseFactory.withDisplayDefaults({
  instance_id: "modal-release-instance",
  basic_information: basicInformationFactory.build({
    id: OTHER_RELEASE_ID,
    title: "Other Album",
    resource_url: `https://api.discogs.com/releases/${OTHER_RELEASE_ID}`,
  }),
});

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders authInitialState={testAuthenticatedAuthState}>
      <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
    </TestProviders>
  );
};

describe("useReleaseModalPlayback", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(mockApi, releaseDetail);
  });

  it("resolves tracks immediately when the modal reopens with cached release detail", async () => {
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useReleaseModalPlayback({
          release: collectionRelease,
          isOpen,
        }),
      {
        initialProps: { isOpen: true },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.tracks.length).toBeGreaterThan(0);
    });

    rerender({ isOpen: false });

    rerender({ isOpen: true });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.tracks.length).toBeGreaterThan(0);
  });

  it("loads the modal tracklist while a different release plays in the dock", async () => {
    setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
      [String(OTHER_RELEASE_ID)]: otherReleaseDetail,
    });

    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: otherCollectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.playback.startPlayback({
        release: collectionRelease,
        trackPosition: "A",
        trackTitle: "Never Gonna Give You Up",
      });
    });

    await waitFor(() => {
      expect(result.current.playback.isPlaying).toBe(true);
      expect(result.current.modal.isPlayingThisReleaseInBar).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    });

    expect(result.current.modal.isLoading).toBe(false);
    expect(result.current.modal.tracks.map((track) => track.position)).toEqual([
      "A1",
      "A2",
    ]);
  });

  it("does not show loading after clear queue, stop playback, and reopening the modal", async () => {
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen,
        }),
        playback: useReleasePlayback(),
      }),
      {
        initialProps: { isOpen: true },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.modal.handleTrackSelect("A");
    });

    await waitFor(() => {
      expect(result.current.playback.isPlaying).toBe(true);
    });

    act(() => {
      result.current.playback.clearQueue();
      result.current.playback.stopPlayback();
    });

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    expect(result.current.modal.isLoading).toBe(false);
    expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    expect(mockApi.discogsRelease).toHaveBeenCalledTimes(1);
  });

  it("does not show loading skeleton when the release query is disabled", () => {
    const { result } = renderHook(
      () =>
        useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });

  it("does not show loading skeleton when the release id cannot be resolved", () => {
    const releaseWithoutId = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({
        id: 0,
        resource_url: "https://example.com/not-a-release",
      }),
    });

    const { result } = renderHook(
      () =>
        useReleaseModalPlayback({
          release: releaseWithoutId,
          isOpen: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });

  describe("tracklist loading lifecycle", () => {
    it("does not treat idle pending state as loading when the query is disabled", () => {
      const { result } = renderHook(
        () =>
          useReleaseModalPlayback({
            release: collectionRelease,
            isOpen: false,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.tracks).toEqual([]);
      expect(mockApi.discogsRelease).not.toHaveBeenCalled();
    });

    it("shows loading only while the first fetch is in flight", async () => {
      let resolveFetch!: (value: typeof releaseDetail) => void;

      mockApi.discogsRelease.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const { result } = renderHook(
        () =>
          useReleaseModalPlayback({
            release: collectionRelease,
            isOpen: true,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tracks).toEqual([]);

      await act(async () => {
        resolveFetch(releaseDetail);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.tracks.length).toBeGreaterThan(0);
      });
    });

    it("fetches release detail when the modal opens with an empty cache", async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useReleaseModalPlayback({
            release: collectionRelease,
            isOpen,
          }),
        {
          initialProps: { isOpen: false },
          wrapper: createWrapper(),
        },
      );

      expect(mockApi.discogsRelease).not.toHaveBeenCalled();

      rerender({ isOpen: true });

      expect(mockApi.discogsRelease).toHaveBeenCalledWith(String(RELEASE_ID));

      await waitFor(() => {
        expect(result.current.tracks.length).toBeGreaterThan(0);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("loads tracklist data when switching to a different release in the modal", async () => {
      setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
        [String(OTHER_RELEASE_ID)]: otherReleaseDetail,
      });

      const { result, rerender } = renderHook(
        ({ release }: { release: typeof collectionRelease }) =>
          useReleaseModalPlayback({
            release,
            isOpen: true,
          }),
        {
          initialProps: { release: collectionRelease },
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.tracks.length).toBeGreaterThan(0);
      });

      rerender({ release: otherCollectionRelease });

      await waitFor(() => {
        expect(result.current.tracks.map((track) => track.title)).toContain(
          "Modal Track One",
        );
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  it("does not stay loading on reopen while the same release plays in the dock", async () => {
    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.modal.handleTrackSelect("A");
    });

    await waitFor(() => {
      expect(result.current.modal.isPlayingThisReleaseInBar).toBe(true);
    });

    expect(result.current.modal.isLoading).toBe(false);
    expect(result.current.modal.tracks.length).toBeGreaterThan(0);
  });

  it("starts background playback when a track row is selected", async () => {
    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    });

    expect(result.current.modal.activeTrackPosition).toBeNull();

    act(() => {
      result.current.modal.handleTrackSelect("A");
    });

    await waitFor(() => {
      expect(result.current.playback.activeTrackPosition).toBe("A");
      expect(result.current.modal.isPlayingThisReleaseInBar).toBe(true);
    });
  });

  it("toggles play and pause when the active dock track row is clicked again", async () => {
    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.tracks.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.modal.handleTrackSelect("A");
    });

    await waitFor(() => {
      expect(result.current.playback.activeTrackPosition).toBe("A");
      expect(result.current.playback.isPaused).toBe(false);
    });

    act(() => {
      result.current.modal.handleActiveTrackToggle();
    });

    expect(result.current.playback.isPaused).toBe(true);

    act(() => {
      result.current.modal.handleActiveTrackToggle();
    });

    expect(result.current.playback.isPaused).toBe(false);
  });

  it("starts release preview playback for unmatched videos", async () => {
    setupFetchDiscogsReleaseMock(mockApi, {
      ...releaseDetail,
      tracklist: [
        {
          position: "A",
          title: "Unknown Track",
          duration: "3:32",
          type_: "track",
        },
      ],
      videos: [
        {
          description: "Full album upload",
          duration: 330,
          embed: true,
          title: "Full Album Upload",
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
        },
      ],
    });

    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.releasePreviewVideos).toHaveLength(1);
      expect(result.current.modal.hasPlayableTracks).toBe(false);
    });

    act(() => {
      result.current.modal.handlePreviewTrackSelect(
        result.current.modal.releasePreviewTracks[0]?.position ?? "",
      );
    });

    await waitFor(() => {
      expect(result.current.playback.isReleasePreview).toBe(true);
      expect(result.current.playback.activePlaybackTitle).toBe(
        "Full Album Upload",
      );
      expect(result.current.modal.activePreviewTrackPosition).toBe(
        result.current.modal.releasePreviewTracks[0]?.position,
      );
    });
  });

  it("queues preview videos from the preview tracklist", async () => {
    setupFetchDiscogsReleaseMock(mockApi, {
      ...releaseDetail,
      tracklist: [
        {
          position: "A",
          title: "Unknown Track",
          duration: "3:32",
          type_: "track",
        },
      ],
      videos: [
        {
          description: "Full album upload",
          duration: 330,
          embed: true,
          title: "Full Album Upload",
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
        },
      ],
    });

    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.releasePreviewTracks).toHaveLength(1);
    });

    act(() => {
      result.current.modal.handlePreviewTrackQueue(
        result.current.modal.releasePreviewTracks[0]?.position ?? "",
      );
    });

    expect(result.current.playback.isReleasePreview).toBe(true);
    expect(result.current.playback.queue).toHaveLength(0);
  });

  it("queues every playable album track from add-all", async () => {
    setupFetchDiscogsReleaseMock(mockApi, {
      ...releaseDetail,
      videos: [
        {
          description: "Side A",
          duration: 212,
          embed: true,
          title: "Rick Astley - Never Gonna Give You Up",
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
        },
        {
          description: "Side B",
          duration: 210,
          embed: true,
          title: "Rick Astley - Never Gonna Give You Up (Instrumental)",
          uri: "https://www.youtube.com/watch?v=abc12345678",
        },
      ],
    });

    const { result } = renderHook(
      () => ({
        modal: useReleaseModalPlayback({
          release: collectionRelease,
          isOpen: true,
        }),
        playback: useReleasePlayback(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.modal.hasPlayableTracks).toBe(true);
    });

    act(() => {
      result.current.modal.handleAddAllToQueue();
    });

    await waitFor(() => {
      expect(result.current.playback.isMiniPlayerVisible).toBe(true);
    });

    expect(result.current.playback.isPlaying).toBe(true);
    expect(result.current.playback.isPaused).toBe(false);
    expect(result.current.playback.activeTrackPosition).toBe("A");
    expect(result.current.playback.queue).toHaveLength(1);
    expect(
      result.current.playback.queue.map((item) => item.trackPosition),
    ).toEqual(["B"]);
    expect(result.current.modal.allPlayableTracksQueued).toBe(true);
  });
});
