import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";

jest.mock("src/lib/fetchDiscogsReleaseRecord.server", () => ({
  fetchDiscogsReleaseRecord: jest.fn(),
}));

let hydratePublicPlaylistReleases: typeof import("src/lib/public-playlist-discogs.server")["hydratePublicPlaylistReleases"];
let mockFetchDiscogsReleaseRecord: jest.MockedFunction<
  typeof import("src/lib/fetchDiscogsReleaseRecord.server")["fetchDiscogsReleaseRecord"]
>;

describe("buildCollectionReleaseFromDiscogsDetail", () => {
  it("uses the primary image for cover_image instead of the Discogs thumb", async () => {
    const { buildCollectionReleaseFromDiscogsDetail } = await import(
      "src/lib/public-playlist-discogs.server"
    );
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      thumb: "https://i.discogs.com/small-thumb.jpg",
      images: [
        {
          type: "secondary",
          uri: "https://i.discogs.com/secondary.jpg",
        },
        {
          type: "primary",
          uri: "https://i.discogs.com/full-cover.jpg",
        },
      ],
    });

    const release = buildCollectionReleaseFromDiscogsDetail(
      detail,
      "instance-1",
    );

    expect(release.basic_information.cover_image).toBe(
      "https://i.discogs.com/full-cover.jpg",
    );
    expect(release.basic_information.thumb).toBe(
      "https://i.discogs.com/small-thumb.jpg",
    );
  });
});

describe("hydratePublicPlaylistReleases", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [serverModule, fetchModule] = await Promise.all([
      import("src/lib/public-playlist-discogs.server"),
      import("src/lib/fetchDiscogsReleaseRecord.server"),
    ]);
    hydratePublicPlaylistReleases = serverModule.hydratePublicPlaylistReleases;
    mockFetchDiscogsReleaseRecord = jest.mocked(
      fetchModule.fetchDiscogsReleaseRecord,
    );
  });

  it("fetches Discogs release details for tracks with a stored release id", async () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: "instance-9001",
    });
    const discogsId = release.basic_information.id ?? 900001;
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: discogsId,
      title: "Fetched album",
      thumb: "https://i.discogs.com/fetched.jpg",
    });

    mockFetchDiscogsReleaseRecord.mockResolvedValue(detail);

    const tracks = [
      playlistTrackRowFactory.opening({
        instance_id: "instance-9001",
        discogs_release_id: discogsId,
      }),
    ];

    const hydrated = await hydratePublicPlaylistReleases({
      tracks,
      crateSnapshotsByInstanceId: new Map(),
    });

    expect(mockFetchDiscogsReleaseRecord).toHaveBeenCalled();
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.instance_id).toBe("instance-9001");
    expect(hydrated[0]?.basic_information.title).toBe("Fetched album");
    expect(hydrated[0]?.basic_information.thumb).toBe(
      "https://i.discogs.com/fetched.jpg",
    );
    expect(hydrated[0]?.basic_information.cover_image).toBe(
      "https://i.discogs.com/fetched.jpg",
    );
  });

  it("when multiple unique release ids are needed, fetches them concurrently", async () => {
    let inflight = 0;
    let maxInflight = 0;

    mockFetchDiscogsReleaseRecord.mockImplementation(async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      inflight -= 1;
      return discogsReleaseJsonFactory.withTracklistAndVideos();
    });

    const tracks = [
      playlistTrackRowFactory.opening({
        instance_id: "instance-a",
        discogs_release_id: 101,
      }),
      playlistTrackRowFactory.build({
        instance_id: "instance-b",
        discogs_release_id: 202,
      }),
    ];

    await hydratePublicPlaylistReleases({
      tracks,
      crateSnapshotsByInstanceId: new Map(),
    });

    expect(mockFetchDiscogsReleaseRecord).toHaveBeenCalledTimes(2);
    expect(maxInflight).toBe(2);
  });
});
