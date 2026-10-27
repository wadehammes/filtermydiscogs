import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { playlistListRowFactory } from "src/tests/factories/PlaylistListRow.factory";
import {
  type PlaylistDetailFindUniqueRow,
  type PlaylistEngagementSelectRow,
  type PlaylistIdRow,
  type PlaylistListFindManyRow,
  type PlaylistListFindManyWithTrackKeyRow,
  type PlaylistTrackKeyOnlyRow,
  type PlaylistTrackMaxSortOrderAggregate,
  playlistDetailFindUniqueRowFactory,
  playlistEngagementSelectRowFactory,
  playlistIdRowFactory,
  playlistTrackKeyOnlyRowFactory,
  playlistTrackMaxSortOrderAggregateFactory,
} from "src/tests/factories/PlaylistQueryPrisma.factory";
import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import type { PlaylistTrackCreateResultRow } from "src/tests/factories/PlaylistTrackPrisma.factory";
import {
  playlistDetailTrackJoinRowFromDomain,
  playlistTrackCreateResultRowFactory,
} from "src/tests/factories/PlaylistTrackPrisma.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { mockPrismaDelegate } from "src/tests/helpers/mockPrismaDelegate";

jest.mock("src/lib/db", () => ({
  prisma: {
    playlist: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    playlistTrack: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("src/lib/user-track.server", () => ({
  ensureUserTrackMetadata: jest.fn(),
}));

let listPlaylistsForUser: typeof import("src/lib/playlist.server")["listPlaylistsForUser"];
let getPlaylistDetail: typeof import("src/lib/playlist.server")["getPlaylistDetail"];
let addTrackToPlaylist: typeof import("src/lib/playlist.server")["addTrackToPlaylist"];
let reorderPlaylistTracks: typeof import("src/lib/playlist.server")["reorderPlaylistTracks"];
let mockPlaylistFindUnique: jest.Mock<
  (
    ...args: unknown[]
  ) => Promise<PlaylistIdRow | PlaylistDetailFindUniqueRow | null>
>;
let mockPlaylistUpdate: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistEngagementSelectRow>
>;
let mockAggregate: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistTrackMaxSortOrderAggregate>
>;
let mockPlaylistTrackFindUnique: jest.Mock<
  (...args: unknown[]) => Promise<null>
>;
let mockPlaylistTrackCreate: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistTrackCreateResultRow>
>;
let mockEnsureUserTrackMetadata: jest.MockedFunction<
  typeof import("src/lib/user-track.server")["ensureUserTrackMetadata"]
>;

const USER_ID = 3;
const PLAYLIST_ID = "playlist-uuid";

beforeEach(async () => {
  jest.clearAllMocks();

  const [playlistModule, db, userTrackModule] = await Promise.all([
    import("src/lib/playlist.server"),
    import("src/lib/db"),
    import("src/lib/user-track.server"),
  ]);

  listPlaylistsForUser = playlistModule.listPlaylistsForUser;
  getPlaylistDetail = playlistModule.getPlaylistDetail;
  addTrackToPlaylist = playlistModule.addTrackToPlaylist;
  reorderPlaylistTracks = playlistModule.reorderPlaylistTracks;
  mockPlaylistFindUnique = mockPrismaDelegate<
    PlaylistIdRow | PlaylistDetailFindUniqueRow | null
  >(jest.mocked(db.prisma.playlist.findUnique));
  mockPlaylistUpdate = mockPrismaDelegate<PlaylistEngagementSelectRow>(
    jest.mocked(db.prisma.playlist.update),
  );
  mockAggregate = mockPrismaDelegate<PlaylistTrackMaxSortOrderAggregate>(
    jest.mocked(db.prisma.playlistTrack.aggregate),
  );
  mockPlaylistTrackFindUnique = mockPrismaDelegate<null>(
    jest.mocked(db.prisma.playlistTrack.findUnique),
  );
  mockPlaylistTrackFindUnique.mockResolvedValue(null);
  mockPlaylistTrackCreate = mockPrismaDelegate<PlaylistTrackCreateResultRow>(
    jest.mocked(db.prisma.playlistTrack.create),
  );
  mockPlaylistUpdate.mockResolvedValue(
    playlistEngagementSelectRowFactory.build(),
  );
  mockEnsureUserTrackMetadata = jest.mocked(
    userTrackModule.ensureUserTrackMetadata,
  );
});

describe("addTrackToPlaylist", () => {
  it("upserts UserTrack metadata then appends a playlist track with next sort_order", async () => {
    const metadata = trackMetadataBodyFactory.opening();
    mockPlaylistFindUnique.mockResolvedValue(
      playlistIdRowFactory.build({ id: PLAYLIST_ID }),
    );
    mockAggregate.mockResolvedValue(
      playlistTrackMaxSortOrderAggregateFactory.build({
        _max: { sort_order: 10 },
      }),
    );
    mockPlaylistTrackCreate.mockResolvedValue(
      playlistTrackCreateResultRowFactory.fromTrackMetadata(
        USER_ID,
        PLAYLIST_ID,
        metadata.track_key,
        11,
      ),
    );

    const result = await addTrackToPlaylist(USER_ID, PLAYLIST_ID, metadata);

    expect(mockEnsureUserTrackMetadata).toHaveBeenCalledWith(USER_ID, metadata);
    expect(mockPlaylistTrackCreate).toHaveBeenCalledWith({
      data: {
        user_id: USER_ID,
        playlist_id: PLAYLIST_ID,
        track_key: metadata.track_key,
        sort_order: 11,
      },
    });
    expect(result).toEqual({ created: true, sort_order: 11 });
  });

  it("returns duplicate when create hits a unique constraint", async () => {
    const metadata = trackMetadataBodyFactory.opening();
    mockPlaylistFindUnique.mockResolvedValue(
      playlistIdRowFactory.build({ id: PLAYLIST_ID }),
    );
    mockAggregate.mockResolvedValue(
      playlistTrackMaxSortOrderAggregateFactory.build({
        _max: { sort_order: 0 },
      }),
    );
    mockPlaylistTrackCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await addTrackToPlaylist(USER_ID, PLAYLIST_ID, metadata);

    expect(result).toEqual({ created: false, reason: "duplicate" });
  });
});

describe("listPlaylistsForUser", () => {
  it("returns summaries with track counts", async () => {
    const { prisma } = await import("src/lib/db");
    const listRow = playlistListRowFactory.forListTest({
      id: PLAYLIST_ID,
    });
    mockPrismaDelegate<PlaylistListFindManyRow[]>(
      jest.mocked(prisma.playlist.findMany),
    ).mockResolvedValue([listRow]);

    const rows = await listPlaylistsForUser(USER_ID);

    expect(rows).toEqual([
      playlistSummaryFactory.build({
        id: listRow.id,
        name: listRow.name,
        private: listRow.private,
        publicViewCount: listRow.public_view_count,
        publicPlayCount: listRow.public_play_count,
        trackCount: listRow._count.tracks,
        created_at: listRow.created_at.toISOString(),
        updated_at: listRow.updated_at.toISOString(),
      }),
    ]);
  });

  it("returns containsTrack when listing with a trackKey", async () => {
    const { prisma } = await import("src/lib/db");
    const trackKey = "instance-1:A1";
    const listRow = playlistListRowFactory.withTrackKeyProbe({
      id: PLAYLIST_ID,
      tracks: [playlistTrackKeyOnlyRowFactory.build({ track_key: trackKey })],
    });
    mockPrismaDelegate<PlaylistListFindManyWithTrackKeyRow[]>(
      jest.mocked(prisma.playlist.findMany),
    ).mockResolvedValue([listRow]);

    const rows = await listPlaylistsForUser(USER_ID, { trackKey });

    expect(rows).toEqual([
      playlistSummaryFactory.build({
        id: listRow.id,
        name: listRow.name,
        private: listRow.private,
        publicViewCount: listRow.public_view_count,
        publicPlayCount: listRow.public_play_count,
        trackCount: listRow._count.tracks,
        created_at: listRow.created_at.toISOString(),
        updated_at: listRow.updated_at.toISOString(),
        containsTrack: true,
      }),
    ]);
    expect(jest.mocked(prisma.playlist.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          tracks: {
            where: { track_key: trackKey },
            take: 1,
            select: { track_key: true },
          },
        }),
      }),
    );
  });
});

describe("getPlaylistDetail", () => {
  it("maps playlist tracks from joined UserTrack rows", async () => {
    const trackRow = playlistTrackRowFactory.opening();
    mockPlaylistFindUnique.mockResolvedValue(
      playlistDetailFindUniqueRowFactory.build({
        id: PLAYLIST_ID,
        name: "Sunday",
        private: false,
        public_view_count: 0,
        public_play_count: 0,
        created_at: new Date("2026-10-01T00:00:00.000Z"),
        updated_at: new Date("2026-10-02T00:00:00.000Z"),
        tracks: [playlistDetailTrackJoinRowFromDomain(trackRow)],
      }),
    );

    const detail = await getPlaylistDetail(USER_ID, PLAYLIST_ID);

    expect(detail).toEqual(
      playlistDetailFactory.withTracks([trackRow], {
        id: PLAYLIST_ID,
        name: "Sunday",
        created_at: "2026-10-01T00:00:00.000Z",
        updated_at: "2026-10-02T00:00:00.000Z",
      }),
    );
  });
});

describe("reorderPlaylistTracks", () => {
  it("rejects duplicate track keys in the request body", async () => {
    const { prisma } = await import("src/lib/db");
    mockPlaylistFindUnique.mockResolvedValue(
      playlistIdRowFactory.build({ id: PLAYLIST_ID }),
    );
    mockPrismaDelegate<PlaylistTrackKeyOnlyRow[]>(
      jest.mocked(prisma.playlistTrack.findMany),
    ).mockResolvedValue([
      playlistTrackKeyOnlyRowFactory.build({ track_key: "9001:A1" }),
      playlistTrackKeyOnlyRowFactory.build({ track_key: "9001:A2" }),
    ]);

    const reordered = await reorderPlaylistTracks(USER_ID, PLAYLIST_ID, [
      "9001:A1",
      "9001:A1",
    ]);

    expect(reordered).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
