import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
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
        totalReleases: BigInt(100),
        totalTracksSaved: BigInt(7),
        totalCollectors: BigInt(4),
        totalTrackPlays: BigInt(42),
      },
    ]);

    await expect(getPublicCommunityStats()).resolves.toEqual({
      totalCrates: 10,
      totalPublicCrates: 3,
      totalReleases: 100,
      totalTracksSaved: 7,
      totalCollectors: 4,
      totalTrackPlays: 42,
    });
  });
});
