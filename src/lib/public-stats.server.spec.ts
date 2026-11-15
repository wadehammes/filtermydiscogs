import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

type DbModule = typeof import("src/lib/db");

let getPublicCommunityStats: typeof import("src/lib/public-stats.server")["getPublicCommunityStats"];
let mockQueryRaw: jest.MockedFunction<DbModule["prisma"]["$queryRaw"]>;

describe("getPublicCommunityStats", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://test";
    process.env.POSTGRES_URL = "postgres://test";

    const [serverModule, db] = await Promise.all([
      import("src/lib/public-stats.server"),
      import("src/lib/db"),
    ]);
    getPublicCommunityStats = serverModule.getPublicCommunityStats;
    mockQueryRaw = jest.mocked(db.prisma.$queryRaw);
  });

  it("maps aggregate counts including tracks with a saved YouTube link", async () => {
    mockQueryRaw.mockResolvedValue([
      {
        totalCrates: BigInt(10),
        totalPublicCrates: BigInt(3),
        totalPlaylists: BigInt(8),
        totalPublicPlaylists: BigInt(2),
        totalReleases: BigInt(100),
        totalTracksSaved: BigInt(7),
        totalCollectors: BigInt(4),
        totalTrackPlays: BigInt(42),
      },
    ]);

    await expect(getPublicCommunityStats()).resolves.toEqual({
      totalCrates: 10,
      totalPublicCrates: 3,
      totalPlaylists: 8,
      totalPublicPlaylists: 2,
      totalReleases: 100,
      totalTracksSaved: 7,
      totalCollectors: 4,
      totalTrackPlays: 42,
    });
  });

  it("returns null on query failure and retries on the next call", async () => {
    const row = {
      totalCrates: BigInt(1),
      totalPublicCrates: BigInt(0),
      totalPlaylists: BigInt(0),
      totalPublicPlaylists: BigInt(0),
      totalReleases: BigInt(0),
      totalTracksSaved: BigInt(0),
      totalCollectors: BigInt(1),
      totalTrackPlays: BigInt(0),
    };

    mockQueryRaw
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce([row]);

    await expect(getPublicCommunityStats()).resolves.toBeNull();
    await expect(getPublicCommunityStats()).resolves.toEqual({
      totalCrates: 1,
      totalPublicCrates: 0,
      totalPlaylists: 0,
      totalPublicPlaylists: 0,
      totalReleases: 0,
      totalTracksSaved: 0,
      totalCollectors: 1,
      totalTrackPlays: 0,
    });
    expect(mockQueryRaw).toHaveBeenCalledTimes(2);
  });
});
