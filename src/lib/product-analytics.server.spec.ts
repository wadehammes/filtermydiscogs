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
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    productAnalyticsDailyRollup: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let fetchAdminFeatureUsageStats: typeof import("src/lib/product-analytics.server")["fetchAdminFeatureUsageStats"];
let mockEventCount: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["count"]
>;
let mockEventGroupBy: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]
>;
let mockRollupAggregate: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsDailyRollup"]["aggregate"]
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
  mockEventCount = jest.mocked(db.prisma.productAnalyticsEvent.count);
  mockEventGroupBy = jest.mocked(db.prisma.productAnalyticsEvent.groupBy);
  mockRollupAggregate = jest.mocked(
    db.prisma.productAnalyticsDailyRollup.aggregate,
  );
  mockRollupGroupBy = jest.mocked(
    db.prisma.productAnalyticsDailyRollup.groupBy,
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchAdminFeatureUsageStats", () => {
  it("merges rollup totals with raw events since yesterday", async () => {
    mockRollupAggregate
      .mockResolvedValueOnce({
        _sum: { event_count: 40 },
      } as Awaited<
        ReturnType<
          DbModule["prisma"]["productAnalyticsDailyRollup"]["aggregate"]
        >
      >)
      .mockResolvedValueOnce({
        _sum: { event_count: 300 },
      } as Awaited<
        ReturnType<
          DbModule["prisma"]["productAnalyticsDailyRollup"]["aggregate"]
        >
      >);
    mockRollupGroupBy.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(8);
    mockEventGroupBy.mockResolvedValue([]);

    const stats = await fetchAdminFeatureUsageStats();

    expect(stats.totals).toEqual({
      last7Days: 48,
      last30Days: 308,
    });

    expect(mockRollupAggregate).toHaveBeenNthCalledWith(1, {
      where: {
        date: {
          gte: new Date("2026-08-10T00:00:00.000Z"),
          lt: new Date("2026-08-15T00:00:00.000Z"),
        },
      },
      _sum: { event_count: true },
    });
    expect(mockRollupAggregate).toHaveBeenNthCalledWith(2, {
      where: {
        date: {
          gte: new Date("2026-07-18T00:00:00.000Z"),
          lt: new Date("2026-08-15T00:00:00.000Z"),
        },
      },
      _sum: { event_count: true },
    });
    expect(mockEventCount).toHaveBeenCalledWith({
      where: { created_at: { gte: new Date("2026-08-15T00:00:00.000Z") } },
    });
  });

  it("combines rollup dimension counts with recent raw events", async () => {
    mockRollupAggregate.mockResolvedValue({
      _sum: { event_count: 0 },
    } as Awaited<
      ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["aggregate"]>
    >);
    mockRollupGroupBy
      .mockResolvedValueOnce([
        { dimension_key: "/releases", _sum: { event_count: 10 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { dimension_key: "/releases", _sum: { event_count: 50 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { dimension_key: "filterApplied", _sum: { event_count: 4 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { dimension_key: "filterApplied", _sum: { event_count: 20 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["groupBy"]>
      >);
    mockEventCount.mockResolvedValue(3);
    mockEventGroupBy
      .mockResolvedValueOnce([
        { page_path: "/releases", _count: { _all: 2 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { event: "filterApplied", _count: { _all: 1 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >);

    const stats = await fetchAdminFeatureUsageStats();

    expect(stats.pageViews[0]).toEqual({
      key: "/releases",
      label: "/releases",
      last7Days: 12,
      last30Days: 52,
    });
    expect(stats.events[0]).toEqual({
      key: "filterApplied",
      label: "Filter Applied",
      last7Days: 5,
      last30Days: 21,
    });
  });
});
