import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    playlistTrack: { findMany: jest.fn() },
    crateRelease: { findMany: jest.fn() },
    userTrack: { update: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  },
}));

jest.mock("src/lib/public-playlist-query.server", () => ({
  findPublicPlaylistById: jest.fn(),
}));

jest.mock("src/lib/public-playlist-discogs.server", () => ({
  hydratePublicPlaylistReleases: jest.fn(
    async ({
      crateSnapshotsByInstanceId,
    }: {
      crateSnapshotsByInstanceId: Map<string, unknown>;
    }) => [...crateSnapshotsByInstanceId.values()],
  ),
}));

jest.mock("src/lib/discogs-consumer-search.server", () => ({
  searchDiscogsDatabase: jest
    .fn<
      typeof import("src/lib/discogs-consumer-search.server")["searchDiscogsDatabase"]
    >()
    .mockResolvedValue(null),
}));

type DbModule = typeof import("src/lib/db");
type QueryModule = typeof import("src/lib/public-playlist-query.server");

let loadPublicPlaylist: typeof import("src/lib/public-playlist-load.server")["loadPublicPlaylist"];
let mockFindPublicPlaylistById: jest.MockedFunction<
  QueryModule["findPublicPlaylistById"]
>;
let mockPlaylistTrackFindMany: jest.MockedFunction<
  DbModule["prisma"]["playlistTrack"]["findMany"]
>;
let mockCrateReleaseFindMany: jest.MockedFunction<
  DbModule["prisma"]["crateRelease"]["findMany"]
>;
let mockUserFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;

const PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";
const USER_ID = 123;

describe("loadPublicPlaylist", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [loadModule, queryModule, db] = await Promise.all([
      import("src/lib/public-playlist-load.server"),
      import("src/lib/public-playlist-query.server"),
      import("src/lib/db"),
    ]);

    loadPublicPlaylist = loadModule.loadPublicPlaylist;
    mockFindPublicPlaylistById = jest.mocked(
      queryModule.findPublicPlaylistById,
    );
    mockPlaylistTrackFindMany = jest.mocked(db.prisma.playlistTrack.findMany);
    mockCrateReleaseFindMany = jest.mocked(db.prisma.crateRelease.findMany);
    mockUserFindUnique = jest.mocked(db.prisma.user.findUnique);
  });

  it("returns release snapshots keyed by playlist track instance ids", async () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: "instance-9001",
      basic_information: {
        id: 249504,
        thumb: "https://i.discogs.com/test-thumb.jpg",
        cover_image: "https://i.discogs.com/test-cover.jpg",
      },
    });

    mockFindPublicPlaylistById.mockResolvedValue({
      user_id: USER_ID,
      id: PLAYLIST_ID,
      name: "Shared",
      username: "dj",
      private: false,
      public_description: null,
      public_view_count: 5,
      public_play_count: 2,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-02T00:00:00.000Z"),
    });

    mockPlaylistTrackFindMany.mockResolvedValue([
      {
        sort_order: 1,
        track_key: "instance-9001:A1",
        up_count: 0,
        down_count: 0,
        user_track: {
          track_title: "Track one",
          track_position: "A1",
          instance_id: "instance-9001",
          artist: "Artist",
          release_title: "Album",
          youtube_id: null,
          discogs_release_id: null,
        },
      },
    ] as never);

    mockCrateReleaseFindMany.mockResolvedValue([
      {
        instance_id: "instance-9001",
        release_data: release,
      },
    ] as never);

    const payload = await loadPublicPlaylist(PLAYLIST_ID);

    expect(payload?.tracks[0]?.discogs_release_id).toBe(249504);
    expect(payload?.releases).toHaveLength(1);
    expect(payload?.releases[0]?.instance_id).toBe("instance-9001");
    expect(payload?.releases[0]?.basic_information.title).toBe("Test Album");
    expect(payload?.mosaicThumbUrls).toEqual([
      "https://i.discogs.com/test-cover.jpg",
    ]);
    expect(payload?.shareStats).toEqual({
      publicViewCount: 5,
      publicPlayCount: 2,
    });
    expect(payload?.releases[0]).not.toHaveProperty("notes");
  });

  it("when playlist username is unset, resolves owner username for the payload", async () => {
    mockFindPublicPlaylistById.mockResolvedValue({
      user_id: USER_ID,
      id: PLAYLIST_ID,
      name: "Shared",
      username: null,
      private: false,
      public_description: null,
      public_view_count: 0,
      public_play_count: 0,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-02T00:00:00.000Z"),
    });
    mockUserFindUnique.mockResolvedValue({
      username: "collector",
    } as Awaited<ReturnType<DbModule["prisma"]["user"]["findUnique"]>>);
    mockPlaylistTrackFindMany.mockResolvedValue([]);
    mockCrateReleaseFindMany.mockResolvedValue([]);

    const payload = await loadPublicPlaylist(PLAYLIST_ID);

    expect(payload?.playlist.username).toBe("collector");
  });

  it("when a public playlist row is provided, skips findPublicPlaylistById", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(null);
    mockPlaylistTrackFindMany.mockResolvedValue([]);
    mockCrateReleaseFindMany.mockResolvedValue([]);

    const payload = await loadPublicPlaylist(PLAYLIST_ID, {
      playlist: {
        user_id: USER_ID,
        id: PLAYLIST_ID,
        name: "Shared",
        username: "dj",
        private: false,
        public_description: null,
        public_view_count: 0,
        public_play_count: 0,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-02T00:00:00.000Z"),
      },
    });

    expect(mockFindPublicPlaylistById).not.toHaveBeenCalled();
    expect(payload?.playlist.id).toBe(PLAYLIST_ID);
  });
});
