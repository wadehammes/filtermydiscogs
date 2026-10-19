import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchAdminUserTrackStatsResultFactory } from "src/tests/factories/FetchAdminUserTrackStatsResult.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

type DbModule = typeof import("src/lib/db");

let fetchAdminUserTrackStats: typeof import("src/lib/admin-user-track-stats.server")["fetchAdminUserTrackStats"];
let mockQueryRaw: jest.MockedFunction<DbModule["prisma"]["$queryRaw"]>;

const sevenDaysAgo = new Date("2026-10-12T00:00:00.000Z");
const thirtyDaysAgo = new Date("2026-09-19T00:00:00.000Z");

beforeEach(async () => {
  jest.clearAllMocks();

  const [module, db] = await Promise.all([
    import("src/lib/admin-user-track-stats.server"),
    import("src/lib/db"),
  ]);

  fetchAdminUserTrackStats = module.fetchAdminUserTrackStats;
  mockQueryRaw = jest.mocked(db.prisma.$queryRaw);
});

describe("fetchAdminUserTrackStats", () => {
  it("maps overview, activity, growth, and leaderboard SQL rows", async () => {
    const { queryRawResponses, result } =
      fetchAdminUserTrackStatsResultFactory.mappingFixture();

    for (const response of queryRawResponses) {
      mockQueryRaw.mockResolvedValueOnce(response);
    }

    await expect(
      fetchAdminUserTrackStats({ sevenDaysAgo, thirtyDaysAgo }),
    ).resolves.toEqual(result);

    expect(mockQueryRaw).toHaveBeenCalledTimes(6);
  });
});
