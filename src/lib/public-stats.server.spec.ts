import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

jest.mock("src/lib/db", () => ({
  db: {
    raw: {
      sql: () => ({
        returnsRow: () => ({
          build: () => ({}),
        }),
      }),
    },
  },
  queryRawRows: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let getPublicCommunityStats: typeof import("src/lib/public-stats.server")["getPublicCommunityStats"];
let mockQueryRawRows: jest.MockedFunction<DbModule["queryRawRows"]>;

describe("getPublicCommunityStats", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://test";

    const [serverModule, db] = await Promise.all([
      import("src/lib/public-stats.server"),
      import("src/lib/db"),
    ]);
    getPublicCommunityStats = serverModule.getPublicCommunityStats;
    mockQueryRawRows = jest.mocked(db.queryRawRows);
  });

  it("maps aggregate counts including tracks with a saved YouTube link", async () => {
    mockQueryRawRows.mockResolvedValue([
      {
        totalCrates: 10,
        totalPublicCrates: 3,
        totalReleases: 100,
        totalTracksSaved: 7,
        totalCollectors: 4,
        totalTrackPlays: 42,
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
