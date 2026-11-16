import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    productAnalyticsEvent: {
      groupBy: jest.fn(),
    },
    productAnalyticsDailyRollup: {
      groupBy: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let fetchAdminFeatureUsageStats: typeof import("src/lib/product-analytics.server")["fetchAdminFeatureUsageStats"];
let mockEventGroupBy: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]
>;
let mockRollupGroupBy: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]
>;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-16T15:00:00.000Z"));

  const [productAnalyticsModule, db] = await Promise.all([
    import("src/lib/product-analytics.server"),
    import("src/lib/db"),
  ]);

  fetchAdminFeatureUsageStats =
    productAnalyticsModule.fetchAdminFeatureUsageStats;
  mockEventGroupBy = jest.mocked(db.prisma.productAnalyticsEvent.groupBy);
  mockRollupGroupBy = jest.mocked(
    db.prisma.productAnalyticsDailyRollup.groupBy,
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchAdminFeatureUsageStats", () => {
  it("reads page views from completed rollup days and raw views since yesterday", async () => {
    mockRollupGroupBy.mockResolvedValue([]);
    mockEventGroupBy.mockResolvedValue([]);

    const stats = await fetchAdminFeatureUsageStats();

    expect(stats).toEqual({ pageViews: [] });
    expect(mockRollupGroupBy).toHaveBeenCalledTimes(2);
    expect(mockRollupGroupBy.mock.calls[0]?.[0]).toEqual({
      by: ["dimension_key"],
      where: {
        dimension_type: "page_path",
        date: {
          gte: new Date("2026-08-10T00:00:00.000Z"),
          lt: new Date("2026-08-15T00:00:00.000Z"),
        },
      },
      _sum: { event_count: true },
    });
    expect(mockRollupGroupBy.mock.calls[1]?.[0]).toEqual({
      by: ["dimension_key"],
      where: {
        dimension_type: "page_path",
        date: {
          gte: new Date("2026-07-18T00:00:00.000Z"),
          lt: new Date("2026-08-15T00:00:00.000Z"),
        },
      },
      _sum: { event_count: true },
    });
    expect(mockEventGroupBy).toHaveBeenCalledTimes(1);
    expect(mockEventGroupBy.mock.calls[0]?.[0]).toEqual({
      by: ["page_path"],
      where: {
        event: "pageView",
        page_path: { not: null },
        created_at: { gte: new Date("2026-08-15T00:00:00.000Z") },
      },
      _count: { _all: true },
    });
  });

  it("combines rollup page paths with recent raw page views", async () => {
    mockRollupGroupBy
      .mockResolvedValueOnce([
        { dimension_key: "/collection", _sum: { event_count: 10 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { dimension_key: "/collection", _sum: { event_count: 50 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >);
    mockEventGroupBy.mockResolvedValue([
      { page_path: "/collection", _count: { _all: 2 } },
    ] as Awaited<
      ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
    >);

    const stats = await fetchAdminFeatureUsageStats();

    expect(stats.pageViews[0]).toEqual({
      key: "/collection",
      label: "/collection",
      last7Days: 12,
      last30Days: 52,
    });
  });
});
