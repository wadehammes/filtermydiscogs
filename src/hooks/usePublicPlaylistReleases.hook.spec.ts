import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createElement, type ReactNode } from "react";
import { api } from "src/api/urls";
import { ReleasePlaybackVisibilityContext } from "src/context/releasePlaybackContexts";
import { usePublicPlaylistReleases } from "src/hooks/usePublicPlaylistReleases.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const PublicPlaylistReleasesDockHiddenWrapper = ({
  children,
}: {
  children: ReactNode;
}) =>
  createElement(
    ReleasePlaybackVisibilityContext.Provider,
    { value: false },
    children,
  );

const PublicPlaylistReleasesDockVisibleWrapper = ({
  children,
}: {
  children: ReactNode;
}) =>
  createElement(
    ReleasePlaybackVisibilityContext.Provider,
    { value: true },
    children,
  );

describe("usePublicPlaylistReleases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockApi, {
      discogsRelease: jest.fn(),
      discogsReleaseBatch: jest.fn(),
    });
  });

  it("loads unique Discogs releases via batch and merges cover art onto playlist rows", async () => {
    const trackA = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
      track_key: "9001:A",
      track_position: "A",
    });
    const trackB = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
      track_key: "9001:B",
      track_position: "B",
    });
    const apiRelease = releaseFactory.build({
      instance_id: "9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      images: [
        {
          type: "primary",
          uri: "https://i.discogs.com/cover.jpg",
        },
      ],
    });

    setupFetchDiscogsReleaseMock(mockApi, detail);

    const { result } = renderFeatureHook(
      () =>
        usePublicPlaylistReleases({
          tracks: [trackA, trackB],
          apiReleases: [apiRelease],
        }),
      { wrapper: PublicPlaylistReleasesDockHiddenWrapper },
    );

    await waitFor(() => {
      expect(
        result.current.releaseByInstanceId.get("9001")?.basic_information
          .cover_image,
      ).toBe("https://i.discogs.com/cover.jpg");
    });

    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledWith(["249504"]);
    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });

  it("when SSR snapshots already include cover art, does not call release batch", async () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
    });
    const apiRelease = releaseFactory.build({
      instance_id: "9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: 249504,
        thumb: "https://i.discogs.com/ssr-thumb.jpg",
        cover_image: "https://i.discogs.com/ssr-cover.jpg",
      },
    });

    const { result } = renderFeatureHook(
      () =>
        usePublicPlaylistReleases({
          tracks: [track],
          apiReleases: [apiRelease],
        }),
      { wrapper: PublicPlaylistReleasesDockHiddenWrapper },
    );

    await waitFor(() => {
      expect(
        result.current.releaseByInstanceId.get("9001")?.basic_information.thumb,
      ).toBe("https://i.discogs.com/ssr-thumb.jpg");
    });

    expect(mockApi.discogsReleaseBatch).not.toHaveBeenCalled();
  });

  it("when the playback dock is visible, does not call release batch", async () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
    });
    const apiRelease = releaseFactory.build({
      instance_id: "9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });

    const { result } = renderFeatureHook(
      () =>
        usePublicPlaylistReleases({
          tracks: [track],
          apiReleases: [apiRelease],
        }),
      { wrapper: PublicPlaylistReleasesDockVisibleWrapper },
    );

    await waitFor(() => {
      expect(result.current.releaseByInstanceId.get("9001")).toBeDefined();
    });

    expect(mockApi.discogsReleaseBatch).not.toHaveBeenCalled();
  });
});
