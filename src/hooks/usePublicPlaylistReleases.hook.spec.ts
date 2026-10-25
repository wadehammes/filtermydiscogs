import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { api } from "src/api/urls";
import { usePublicPlaylistReleases } from "src/hooks/usePublicPlaylistReleases.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("usePublicPlaylistReleases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(mockApi.discogsRelease)) {
      Object.assign(mockApi, {
        discogsRelease: jest.fn(),
      });
    }
  });

  it("loads each unique Discogs release via React Query and merges cover art onto playlist rows", async () => {
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

    const { result } = renderFeatureHook(() =>
      usePublicPlaylistReleases({
        tracks: [trackA, trackB],
        apiReleases: [apiRelease],
      }),
    );

    await waitFor(() => {
      expect(
        result.current.releaseByInstanceId.get("9001")?.basic_information
          .cover_image,
      ).toBe("https://i.discogs.com/cover.jpg");
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledTimes(1);
    expect(mockApi.discogsRelease).toHaveBeenCalledWith("249504");
  });
});
