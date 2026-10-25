import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    userTrack: { update: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  },
}));

type DbModule = typeof import("src/lib/db");

let backfillDiscogsReleaseIdsForPlaylistTracks: typeof import("src/lib/backfill-user-track-discogs-release-id.server")["backfillDiscogsReleaseIdsForPlaylistTracks"];
let mockUserTrackUpdate: jest.MockedFunction<
  DbModule["prisma"]["userTrack"]["update"]
>;
let mockTransaction: jest.MockedFunction<DbModule["prisma"]["$transaction"]>;

const USER_ID = 42;

describe("backfillDiscogsReleaseIdsForPlaylistTracks", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [backfillModule, db] = await Promise.all([
      import("src/lib/backfill-user-track-discogs-release-id.server"),
      import("src/lib/db"),
    ]);
    backfillDiscogsReleaseIdsForPlaylistTracks =
      backfillModule.backfillDiscogsReleaseIdsForPlaylistTracks;
    mockUserTrackUpdate = jest.mocked(db.prisma.userTrack.update);
    mockTransaction = jest.mocked(db.prisma.$transaction);
    mockUserTrackUpdate.mockResolvedValue({} as never);
  });

  it("persists discogs_release_id from the owner crate snapshot when the track row is missing it", async () => {
    const discogsId = 249504;
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: null,
      instance_id: "instance-9001",
    });
    const snapshot = releaseFactory.build({
      instance_id: "instance-9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: discogsId,
      },
    });

    const patched = await backfillDiscogsReleaseIdsForPlaylistTracks({
      userId: USER_ID,
      tracks: [track],
      crateSnapshotsByInstanceId: new Map([["instance-9001", snapshot]]),
    });

    expect(patched[0]?.discogs_release_id).toBe(discogsId);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUserTrackUpdate).toHaveBeenCalledWith({
      where: {
        user_id_track_key: {
          user_id: USER_ID,
          track_key: track.track_key,
        },
      },
      data: { discogs_release_id: discogsId },
    });
  });

  it("skips tracks that already store discogs_release_id", async () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
    });

    await backfillDiscogsReleaseIdsForPlaylistTracks({
      userId: USER_ID,
      tracks: [track],
      crateSnapshotsByInstanceId: new Map(),
    });

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
