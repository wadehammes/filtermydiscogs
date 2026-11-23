import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    crateRelease: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("src/lib/playlist-release-snapshot.server", () => ({
  persistPlaylistReleaseSnapshots: jest.fn(),
}));

const USER_ID = 42;
const PLAYLIST_ID = "playlist-1";
const INSTANCE_ID = "9001";

let ensurePlaylistReleaseSnapshotOnTrackAdd: typeof import("src/lib/ensure-playlist-release-snapshot-on-add.server")["ensurePlaylistReleaseSnapshotOnTrackAdd"];
let persistPlaylistReleaseSnapshots: jest.MockedFunction<
  typeof import("src/lib/playlist-release-snapshot.server")["persistPlaylistReleaseSnapshots"]
>;
let mockCrateReleaseFindFirst: jest.MockedFunction<
  (args: unknown) => Promise<{ release_data: unknown } | null>
>;

describe("ensurePlaylistReleaseSnapshotOnTrackAdd", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [ensureModule, snapshotModule, db] = await Promise.all([
      import("src/lib/ensure-playlist-release-snapshot-on-add.server"),
      import("src/lib/playlist-release-snapshot.server"),
      import("src/lib/db"),
    ]);
    ensurePlaylistReleaseSnapshotOnTrackAdd =
      ensureModule.ensurePlaylistReleaseSnapshotOnTrackAdd;
    persistPlaylistReleaseSnapshots = jest.mocked(
      snapshotModule.persistPlaylistReleaseSnapshots,
    );
    mockCrateReleaseFindFirst = jest.mocked(
      db.prisma.crateRelease.findFirst,
    ) as jest.MockedFunction<
      (args: unknown) => Promise<{ release_data: unknown } | null>
    >;
    persistPlaylistReleaseSnapshots.mockResolvedValue(undefined);
    mockCrateReleaseFindFirst.mockResolvedValue(null);
  });

  it("persists a validated release snapshot from the request body", async () => {
    const release = releaseFactory.build({
      instance_id: INSTANCE_ID,
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/thumb.jpg",
        cover_image: "https://i.discogs.com/cover.jpg",
      },
    });

    await ensurePlaylistReleaseSnapshotOnTrackAdd({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      instanceId: INSTANCE_ID,
      releaseFromRequest: release,
    });

    expect(persistPlaylistReleaseSnapshots).toHaveBeenCalledWith({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      releases: [expect.objectContaining({ instance_id: INSTANCE_ID })],
    });
    expect(mockCrateReleaseFindFirst).not.toHaveBeenCalled();
  });

  it("falls back to owner crate release_data when the request snapshot has no art", async () => {
    const releaseFromRequest = releaseFactory.build({
      instance_id: INSTANCE_ID,
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });
    const fromCrate = releaseFactory.build({
      instance_id: INSTANCE_ID,
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/crate-thumb.jpg",
        cover_image: "https://i.discogs.com/crate-cover.jpg",
      },
    });
    mockCrateReleaseFindFirst.mockResolvedValue({ release_data: fromCrate });

    await ensurePlaylistReleaseSnapshotOnTrackAdd({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      instanceId: INSTANCE_ID,
      releaseFromRequest: releaseFromRequest,
    });

    expect(mockCrateReleaseFindFirst).toHaveBeenCalled();
    expect(persistPlaylistReleaseSnapshots).toHaveBeenCalled();
  });

  it("does not persist when no art is available from request or crate", async () => {
    const releaseFromRequest = releaseFactory.build({
      instance_id: INSTANCE_ID,
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });

    await ensurePlaylistReleaseSnapshotOnTrackAdd({
      userId: USER_ID,
      playlistId: PLAYLIST_ID,
      instanceId: INSTANCE_ID,
      releaseFromRequest: releaseFromRequest,
    });

    expect(persistPlaylistReleaseSnapshots).not.toHaveBeenCalled();
  });
});
