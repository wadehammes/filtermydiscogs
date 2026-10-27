import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { PlaylistEngagementSelectRow } from "src/tests/factories/PlaylistQueryPrisma.factory";
import { playlistEngagementSelectRowFactory } from "src/tests/factories/PlaylistQueryPrisma.factory";
import { publicPlaylistRowFactory } from "src/tests/factories/PublicPlaylistRow.factory";
import { mockPrismaDelegate } from "src/tests/helpers/mockPrismaDelegate";

jest.mock("src/lib/public-playlist-query.server", () => ({
  findPublicPlaylistById: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    playlist: {
      update: jest.fn(),
    },
  },
}));

type QueryModule = typeof import("src/lib/public-playlist-query.server");

let mockFindPublicPlaylistById: jest.MockedFunction<
  QueryModule["findPublicPlaylistById"]
>;
let recordPublicPlaylistView: typeof import("src/lib/playlist-engagement.server")["recordPublicPlaylistView"];
let recordPublicPlaylistPlay: typeof import("src/lib/playlist-engagement.server")["recordPublicPlaylistPlay"];
let mockPlaylistUpdate: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistEngagementSelectRow>
>;

beforeEach(async () => {
  jest.clearAllMocks();
  const engagement = await import("src/lib/playlist-engagement.server");
  recordPublicPlaylistView = engagement.recordPublicPlaylistView;
  recordPublicPlaylistPlay = engagement.recordPublicPlaylistPlay;
  const query = await import("src/lib/public-playlist-query.server");
  mockFindPublicPlaylistById = jest.mocked(query.findPublicPlaylistById);
  const { prisma } = await import("src/lib/db");
  mockPlaylistUpdate = mockPrismaDelegate<PlaylistEngagementSelectRow>(
    jest.mocked(prisma.playlist.update),
  );
});

describe("playlist-engagement.server", () => {
  it("increments public view count for non-owner viewers", async () => {
    const row = publicPlaylistRowFactory.build({
      user_id: 100,
      public_view_count: 2,
      public_play_count: 1,
    });
    mockFindPublicPlaylistById.mockResolvedValue(row);
    mockPlaylistUpdate.mockResolvedValue(
      playlistEngagementSelectRowFactory.build({
        public_view_count: 3,
        public_play_count: 1,
      }),
    );

    const stats = await recordPublicPlaylistView(row.id, 200);

    expect(stats).toEqual({ publicViewCount: 3, publicPlayCount: 1 });
    expect(mockPlaylistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { public_view_count: { increment: 1 } },
      }),
    );
  });

  it("returns current stats without incrementing for the playlist owner", async () => {
    const row = publicPlaylistRowFactory.build({
      user_id: 100,
      public_view_count: 4,
      public_play_count: 2,
    });
    mockFindPublicPlaylistById.mockResolvedValue(row);

    const stats = await recordPublicPlaylistView(row.id, 100);

    expect(stats).toEqual({ publicViewCount: 4, publicPlayCount: 2 });
    expect(mockPlaylistUpdate).not.toHaveBeenCalled();
  });

  it("returns current stats without incrementing play count for the playlist owner", async () => {
    const row = publicPlaylistRowFactory.build({
      user_id: 100,
      public_play_count: 2,
    });
    mockFindPublicPlaylistById.mockResolvedValue(row);

    const stats = await recordPublicPlaylistPlay(row.id, 100);

    expect(stats).toEqual({
      publicViewCount: row.public_view_count,
      publicPlayCount: 2,
    });
    expect(mockPlaylistUpdate).not.toHaveBeenCalled();
  });

  it("increments public play count for anonymous listeners", async () => {
    const row = publicPlaylistRowFactory.build({ user_id: 55 });
    mockFindPublicPlaylistById.mockResolvedValue(row);
    mockPlaylistUpdate.mockResolvedValue(
      playlistEngagementSelectRowFactory.build({
        public_view_count: 0,
        public_play_count: 1,
      }),
    );

    const stats = await recordPublicPlaylistPlay(row.id, null);

    expect(stats).toEqual({ publicViewCount: 0, publicPlayCount: 1 });
    expect(mockPlaylistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { public_play_count: { increment: 1 } },
      }),
    );
  });
});
