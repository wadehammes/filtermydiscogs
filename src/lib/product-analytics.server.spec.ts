import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("@prisma/orm-postgres/orm-client", () => ({
  and: (...conditions: unknown[]) => conditions,
}));

jest.mock("src/lib/db", () => dbMock);

let fetchAdminFeatureUsageStats: typeof import("src/lib/product-analytics.server")["fetchAdminFeatureUsageStats"];
let mockCountRows: typeof dbMock.countRows;
let mockRollupAggregate: typeof dbMock.orm.ProductAnalyticsDailyRollups.aggregate;
let mockRollupGroupBy: typeof dbMock.orm.ProductAnalyticsDailyRollups.groupBy;
let mockEventGroupBy: typeof dbMock.orm.ProductAnalyticsEvents.groupBy;
let mockEventAggregate: typeof dbMock.orm.ProductAnalyticsEvents.aggregate;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-16T15:00:00.000Z"));

  const productAnalyticsModule = await import(
    "src/lib/product-analytics.server"
  );

  fetchAdminFeatureUsageStats =
    productAnalyticsModule.fetchAdminFeatureUsageStats;
  mockCountRows = dbMock.countRows;
  mockRollupAggregate = dbMock.orm.ProductAnalyticsDailyRollups.aggregate;
  mockRollupGroupBy = dbMock.orm.ProductAnalyticsDailyRollups.groupBy;
  mockEventGroupBy = dbMock.orm.ProductAnalyticsEvents.groupBy;
  mockEventAggregate = dbMock.orm.ProductAnalyticsEvents.aggregate;
  mockRollupGroupBy.mockReturnValue(dbMock.orm.ProductAnalyticsDailyRollups);
  mockEventGroupBy.mockReturnValue(dbMock.orm.ProductAnalyticsEvents);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchAdminFeatureUsageStats", () => {
  it("merges rollup totals with raw events since yesterday", async () => {
    mockRollupAggregate
      .mockResolvedValueOnce({ total: 40 })
      .mockResolvedValueOnce({ total: 300 })
      .mockResolvedValue([]);
    mockCountRows.mockResolvedValue(8);
    mockEventAggregate.mockResolvedValue([]);

    const stats = await fetchAdminFeatureUsageStats();

    expect(stats.totals).toEqual({
      last7Days: 48,
      last30Days: 308,
    });

    expect(mockRollupAggregate).toHaveBeenCalledTimes(6);
    expect(mockCountRows).toHaveBeenCalled();
  });

  it("combines rollup dimension counts with recent raw events", async () => {
    mockRollupAggregate
      .mockResolvedValueOnce({ total: 0 })
      .mockResolvedValueOnce({ total: 0 })
      .mockResolvedValueOnce([{ dimensionKey: "/releases", count: 10 }])
      .mockResolvedValueOnce([{ dimensionKey: "/releases", count: 50 }])
      .mockResolvedValueOnce([{ dimensionKey: "filterApplied", count: 4 }])
      .mockResolvedValueOnce([{ dimensionKey: "filterApplied", count: 20 }]);
    mockCountRows.mockResolvedValue(3);
    mockEventAggregate
      .mockResolvedValueOnce([{ pagePath: "/releases", count: 2 }])
      .mockResolvedValueOnce([{ event: "filterApplied", count: 1 }]);

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
