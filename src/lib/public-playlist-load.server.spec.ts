import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  type CrateReleaseReleaseDataFindManyRow,
  crateReleaseFactory,
} from "src/tests/factories/CrateRelease.factory";
import {
  type PlaylistReleaseSnapshotFindManyRow,
  playlistReleaseSnapshotFindManyRowFactory,
  playlistReleaseSnapshotUpsertResultFactory,
} from "src/tests/factories/PlaylistReleaseSnapshotPrisma.factory";
import {
  type PlaylistDetailTrackJoinRow,
  playlistDetailTrackJoinRowFactory,
} from "src/tests/factories/PlaylistTrackPrisma.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { publicPlaylistRowFactory } from "src/tests/factories/PublicPlaylistRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { prismaUserFactory } from "src/tests/factories/User.factory";
import { mockPrismaDelegate } from "src/tests/helpers/mockPrismaDelegate";

jest.mock("src/lib/db", () => ({
  prisma: {
    playlistTrack: { findMany: jest.fn() },
    crateRelease: { findMany: jest.fn() },
    playlistReleaseSnapshot: { findMany: jest.fn(), upsert: jest.fn() },
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
  buildPublicPlaylistReleasesFromSnapshots: ({
    tracks,
    snapshotsByInstanceId,
  }: {
    tracks: { instance_id: string }[];
    snapshotsByInstanceId: Map<string, unknown>;
  }) => {
    const releases: unknown[] = [];
    const seenInstanceIds = new Set<string>();

    for (const track of tracks) {
      const instanceId = String(track.instance_id);

      if (seenInstanceIds.has(instanceId)) {
        continue;
      }

      seenInstanceIds.add(instanceId);
      const snapshot = snapshotsByInstanceId.get(instanceId);

      if (snapshot) {
        releases.push(snapshot);
      }
    }

    return releases;
  },
  hydratePublicPlaylistReleases: jest.fn(
    async ({
      crateSnapshotsByInstanceId,
    }: {
      crateSnapshotsByInstanceId: Map<string, unknown>;
    }) => [...crateSnapshotsByInstanceId.values()],
  ),
  backfillMissingDisplayArtInSnapshotMap: jest.fn(async () => []),
}));

jest.mock("src/lib/discogs-consumer-search.server", () => ({
  searchDiscogsDatabase: jest
    .fn<
      typeof import("src/lib/discogs-consumer-search.server")["searchDiscogsDatabase"]
    >()
    .mockResolvedValue(null),
}));

type DiscogsModule = typeof import("src/lib/public-playlist-discogs.server");
type QueryModule = typeof import("src/lib/public-playlist-query.server");

let loadPublicPlaylist: typeof import("src/lib/public-playlist-load.server")["loadPublicPlaylist"];
let mockFindPublicPlaylistById: jest.MockedFunction<
  QueryModule["findPublicPlaylistById"]
>;
let mockPlaylistTrackFindMany: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistDetailTrackJoinRow[]>
>;
let mockCrateReleaseFindMany: jest.Mock<
  (...args: unknown[]) => Promise<CrateReleaseReleaseDataFindManyRow[]>
>;
let mockPlaylistReleaseSnapshotFindMany: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistReleaseSnapshotFindManyRow[]>
>;
let mockPlaylistReleaseSnapshotUpsert: jest.Mock<
  (
    ...args: unknown[]
  ) => Promise<
    ReturnType<typeof playlistReleaseSnapshotUpsertResultFactory.build>
  >
>;
let mockUserFindUnique: jest.Mock<
  (...args: unknown[]) => Promise<import("@prisma/client").User | null>
>;
let mockHydratePublicPlaylistReleases: jest.MockedFunction<
  DiscogsModule["hydratePublicPlaylistReleases"]
>;
let mockBackfillMissingDisplayArtInSnapshotMap: jest.MockedFunction<
  DiscogsModule["backfillMissingDisplayArtInSnapshotMap"]
>;

const PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";
const USER_ID = 123;

describe("loadPublicPlaylist", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [loadModule, queryModule, db, discogsModule] = await Promise.all([
      import("src/lib/public-playlist-load.server"),
      import("src/lib/public-playlist-query.server"),
      import("src/lib/db"),
      import("src/lib/public-playlist-discogs.server"),
    ]);

    loadPublicPlaylist = loadModule.loadPublicPlaylist;
    mockHydratePublicPlaylistReleases = jest.mocked(
      discogsModule.hydratePublicPlaylistReleases,
    );
    mockBackfillMissingDisplayArtInSnapshotMap = jest.mocked(
      discogsModule.backfillMissingDisplayArtInSnapshotMap,
    );
    mockFindPublicPlaylistById = jest.mocked(
      queryModule.findPublicPlaylistById,
    );
    mockPlaylistTrackFindMany = mockPrismaDelegate<
      PlaylistDetailTrackJoinRow[]
    >(jest.mocked(db.prisma.playlistTrack.findMany));
    mockCrateReleaseFindMany = mockPrismaDelegate<
      CrateReleaseReleaseDataFindManyRow[]
    >(jest.mocked(db.prisma.crateRelease.findMany));
    mockPlaylistReleaseSnapshotFindMany = mockPrismaDelegate<
      PlaylistReleaseSnapshotFindManyRow[]
    >(jest.mocked(db.prisma.playlistReleaseSnapshot.findMany));
    mockPlaylistReleaseSnapshotUpsert = mockPrismaDelegate<
      ReturnType<typeof playlistReleaseSnapshotUpsertResultFactory.build>
    >(jest.mocked(db.prisma.playlistReleaseSnapshot.upsert));
    mockUserFindUnique = mockPrismaDelegate<
      import("@prisma/client").User | null
    >(jest.mocked(db.prisma.user.findUnique));
    mockPlaylistReleaseSnapshotFindMany.mockResolvedValue([]);
    mockPlaylistReleaseSnapshotUpsert.mockResolvedValue(
      playlistReleaseSnapshotUpsertResultFactory.build(),
    );
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

    mockFindPublicPlaylistById.mockResolvedValue(
      publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
        public_view_count: 5,
        public_play_count: 2,
      }),
    );

    mockPlaylistTrackFindMany.mockResolvedValue([
      playlistDetailTrackJoinRowFactory.fromTrackRow(
        playlistTrackRowFactory.build({
          track_key: "instance-9001:A1",
          track_position: "A1",
          instance_id: "instance-9001",
          track_title: "Track one",
          youtube_id: null,
          discogs_release_id: null,
        }),
      ),
    ]);

    mockCrateReleaseFindMany.mockResolvedValue([
      crateReleaseFactory.releaseDataFindManyRow(release),
    ]);

    const payload = await loadPublicPlaylist(PLAYLIST_ID, {
      discogsHydration: "full",
    });

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
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    expect(mockPlaylistReleaseSnapshotUpsert).toHaveBeenCalled();
  });

  it("when playlist snapshot has no art but crate snapshot does, uses crate art and backfills playlist_release_snapshots", async () => {
    const crateRelease = releaseFactory.withDisplayDefaults({
      instance_id: "instance-9001",
      basic_information: {
        thumb: "https://i.discogs.com/crate-thumb.jpg",
        cover_image: "https://i.discogs.com/crate-cover.jpg",
      },
    });
    const emptyPlaylistSnapshot = releaseFactory.build({
      instance_id: "instance-9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });

    mockFindPublicPlaylistById.mockResolvedValue(
      publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
      }),
    );
    mockPlaylistTrackFindMany.mockResolvedValue([
      playlistDetailTrackJoinRowFactory.fromTrackRow(
        playlistTrackRowFactory.build({
          track_key: "instance-9001:A1",
          track_position: "A1",
          instance_id: "instance-9001",
          track_title: "Track one",
          youtube_id: null,
          discogs_release_id: 249504,
        }),
      ),
    ]);
    mockCrateReleaseFindMany.mockResolvedValue([
      crateReleaseFactory.releaseDataFindManyRow(crateRelease),
    ]);
    mockPlaylistReleaseSnapshotFindMany.mockResolvedValue([
      playlistReleaseSnapshotFindManyRowFactory.fromDiscogsRelease(
        emptyPlaylistSnapshot,
      ),
    ]);

    const payload = await loadPublicPlaylist(PLAYLIST_ID, {
      discogsHydration: "snapshotsOnly",
    });

    expect(payload?.releases[0]?.basic_information.cover_image).toBe(
      "https://i.discogs.com/crate-cover.jpg",
    );
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    expect(mockPlaylistReleaseSnapshotUpsert).toHaveBeenCalled();
  });

  it("when discogsHydration is snapshotsOnly on a public playlist, backfills missing art via snapshot map only", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(
      publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
      }),
    );
    mockPlaylistTrackFindMany.mockResolvedValue([
      playlistDetailTrackJoinRowFactory.fromTrackRow(
        playlistTrackRowFactory.build({
          track_key: "instance-9001:A1",
          instance_id: "instance-9001",
          discogs_release_id: 249504,
        }),
      ),
    ]);
    mockCrateReleaseFindMany.mockResolvedValue([]);
    mockPlaylistReleaseSnapshotFindMany.mockResolvedValue([]);

    await loadPublicPlaylist(PLAYLIST_ID, {
      discogsHydration: "snapshotsOnly",
    });

    expect(mockBackfillMissingDisplayArtInSnapshotMap).toHaveBeenCalledTimes(1);
    expect(mockHydratePublicPlaylistReleases).not.toHaveBeenCalled();
  });

  it("when discogsHydration is snapshotsOnly, does not call hydratePublicPlaylistReleases", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(
      publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
      }),
    );
    mockPlaylistTrackFindMany.mockResolvedValue([
      playlistDetailTrackJoinRowFactory.fromTrackRow(
        playlistTrackRowFactory.build({
          track_key: "instance-9001:A1",
          track_position: "A1",
          instance_id: "instance-9001",
          track_title: "Track one",
          youtube_id: null,
          discogs_release_id: null,
        }),
      ),
    ]);
    mockCrateReleaseFindMany.mockResolvedValue([]);
    mockPlaylistReleaseSnapshotFindMany.mockResolvedValue([]);

    await loadPublicPlaylist(PLAYLIST_ID, {
      discogsHydration: "snapshotsOnly",
    });

    expect(mockHydratePublicPlaylistReleases).not.toHaveBeenCalled();
    expect(mockPlaylistReleaseSnapshotUpsert).not.toHaveBeenCalled();
  });

  it("when playlist username is unset, resolves owner username for the payload", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(
      publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
        username: null,
      }),
    );
    mockUserFindUnique.mockResolvedValue(
      prismaUserFactory.build({ username: "collector" }),
    );
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
      playlist: publicPlaylistRowFactory.forSharedLoadTest({
        user_id: USER_ID,
        id: PLAYLIST_ID,
      }),
    });

    expect(mockFindPublicPlaylistById).not.toHaveBeenCalled();
    expect(payload?.playlist.id).toBe(PLAYLIST_ID);
  });
});
