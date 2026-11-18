import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    playlistReleaseSnapshot: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  },
}));

type DbModule = typeof import("src/lib/db");

let loadPlaylistReleaseSnapshots: typeof import("src/lib/playlist-release-snapshot.server")["loadPlaylistReleaseSnapshots"];
let persistPlaylistReleaseSnapshots: typeof import("src/lib/playlist-release-snapshot.server")["persistPlaylistReleaseSnapshots"];
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["playlistReleaseSnapshot"]["findMany"]
>;
let mockUpsert: jest.MockedFunction<
  DbModule["prisma"]["playlistReleaseSnapshot"]["upsert"]
>;

const USER_ID = 42;
const PLAYLIST_ID = "playlist-uuid";
const INSTANCE_ID = "instance-1";

describe("playlist-release-snapshot.server", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [snapshotModule, db] = await Promise.all([
      import("src/lib/playlist-release-snapshot.server"),
      import("src/lib/db"),
    ]);

    loadPlaylistReleaseSnapshots = snapshotModule.loadPlaylistReleaseSnapshots;
    persistPlaylistReleaseSnapshots =
      snapshotModule.persistPlaylistReleaseSnapshots;
    mockFindMany = jest.mocked(db.prisma.playlistReleaseSnapshot.findMany);
    mockUpsert = jest.mocked(db.prisma.playlistReleaseSnapshot.upsert);
  });

  it("loads validated snapshots keyed by instance id", async () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: INSTANCE_ID,
    });

    mockFindMany.mockResolvedValue([
      {
        instance_id: INSTANCE_ID,
        release_data: release,
      },
    ] as never);

    const snapshots = await loadPlaylistReleaseSnapshots({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      instanceIds: [INSTANCE_ID],
    });

    expect(snapshots.get(INSTANCE_ID)?.instance_id).toBe(INSTANCE_ID);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        user_id: USER_ID,
        playlist_id: PLAYLIST_ID,
        instance_id: { in: [INSTANCE_ID] },
      },
      select: {
        instance_id: true,
        release_data: true,
      },
    });
  });

  it("upserts one row per instance for public playlist hydration", async () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: INSTANCE_ID,
    });

    mockUpsert.mockResolvedValue({} as never);

    await persistPlaylistReleaseSnapshots({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      releases: [release],
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        user_id_playlist_id_instance_id: {
          user_id: USER_ID,
          playlist_id: PLAYLIST_ID,
          instance_id: INSTANCE_ID,
        },
      },
      create: {
        user_id: USER_ID,
        playlist_id: PLAYLIST_ID,
        instance_id: INSTANCE_ID,
        release_data: expect.objectContaining({
          instance_id: INSTANCE_ID,
        }),
      },
      update: {
        release_data: expect.objectContaining({
          instance_id: INSTANCE_ID,
        }),
      },
    });
  });
});
