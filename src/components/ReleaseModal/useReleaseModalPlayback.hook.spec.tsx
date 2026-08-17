import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import * as apiHelpers from "src/api/helpers";
import { useReleaseModalPlayback } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupDiscogsReleaseQueryMock } from "src/tests/mocks/setupDiscogsReleaseQueryMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { act, renderHook, waitFor } from "test-utils";

jest.mock("src/hooks/queries/useDiscogsReleaseQuery");
jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

const RELEASE_ID = 249504;

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_ID,
});

const collectionRelease = releaseFactory.withDisplayDefaults({
  basic_information: basicInformationFactory.build({
    id: RELEASE_ID,
    title: "Never Gonna Give You Up",
    resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
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
    setupDiscogsReleaseQueryMock(releaseDetail);
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
    setupDiscogsReleaseQueryMock({
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
    setupDiscogsReleaseQueryMock({
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

    expect(result.current.playback.queue).toHaveLength(1);
    expect(result.current.playback.queue[0]?.previewVideoUri).toBe(
      "https://www.youtube.com/watch?v=te2jJncBVG4",
    );
  });
});
