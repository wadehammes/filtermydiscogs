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

let rollupProductAnalyticsForDay: typeof import("src/lib/product-analytics-maintenance.server")["rollupProductAnalyticsForDay"];
let rollupCompletedProductAnalyticsDays: typeof import("src/lib/product-analytics-maintenance.server")["rollupCompletedProductAnalyticsDays"];
let deleteExpiredProductAnalyticsEvents: typeof import("src/lib/product-analytics-maintenance.server")["deleteExpiredProductAnalyticsEvents"];
let mockEventsFirst: typeof dbMock.orm.ProductAnalyticsEvents.first;
let mockEventsGroupBy: typeof dbMock.orm.ProductAnalyticsEvents.groupBy;
let mockEventsDeleteAndCount: typeof dbMock.orm.ProductAnalyticsEvents.deleteAndCount;
let mockRollupFirst: typeof dbMock.orm.ProductAnalyticsDailyRollups.first;
let mockRollupUpsert: typeof dbMock.orm.ProductAnalyticsDailyRollups.upsert;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-16T15:00:00.000Z"));

  const maintenanceModule = await import(
    "src/lib/product-analytics-maintenance.server"
  );

  rollupProductAnalyticsForDay = maintenanceModule.rollupProductAnalyticsForDay;
  rollupCompletedProductAnalyticsDays =
    maintenanceModule.rollupCompletedProductAnalyticsDays;
  deleteExpiredProductAnalyticsEvents =
    maintenanceModule.deleteExpiredProductAnalyticsEvents;
  mockEventsFirst = dbMock.orm.ProductAnalyticsEvents.first;
  mockEventsGroupBy = dbMock.orm.ProductAnalyticsEvents.groupBy;
  mockEventsDeleteAndCount = dbMock.orm.ProductAnalyticsEvents.deleteAndCount;
  mockRollupFirst = dbMock.orm.ProductAnalyticsDailyRollups.first;
  mockRollupUpsert = dbMock.orm.ProductAnalyticsDailyRollups.upsert;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("product analytics maintenance", () => {
  it("bulk upserts daily rollups for page views and interactions", async () => {
    mockEventsGroupBy.mockReturnValue(dbMock.orm.ProductAnalyticsEvents);
    dbMock.orm.ProductAnalyticsEvents.aggregate
      .mockResolvedValueOnce([{ pagePath: "/releases", count: 12 }])
      .mockResolvedValueOnce([{ event: "releaseClicked", count: 5 }]);
    mockRollupUpsert.mockResolvedValue({});

    const dayStart = new Date("2026-08-15T00:00:00.000Z");
    const totals = await rollupProductAnalyticsForDay(dayStart);

    expect(totals).toEqual({ pagePathRows: 1, eventRows: 1 });
    expect(mockRollupUpsert).toHaveBeenCalledTimes(2);
  });

  it("rolls up from the last stored day through yesterday", async () => {
    mockRollupFirst.mockResolvedValue({
      date: new Date("2026-08-14T00:00:00.000Z"),
    });
    mockEventsGroupBy.mockReturnValue(dbMock.orm.ProductAnalyticsEvents);
    dbMock.orm.ProductAnalyticsEvents.aggregate.mockResolvedValue([]);
    mockRollupUpsert.mockResolvedValue({});

    const result = await rollupCompletedProductAnalyticsDays();

    expect(result.daysProcessed).toBe(1);
    expect(dbMock.orm.ProductAnalyticsEvents.aggregate).toHaveBeenCalledTimes(
      2,
    );
    expect(mockEventsFirst).not.toHaveBeenCalled();
  });

  it("backfills from the oldest raw event when no rollups exist", async () => {
    mockRollupFirst.mockResolvedValue(null);
    mockEventsFirst.mockResolvedValue({
      createdAt: new Date("2026-08-14T10:00:00.000Z"),
    });
    mockEventsGroupBy.mockReturnValue(dbMock.orm.ProductAnalyticsEvents);
    dbMock.orm.ProductAnalyticsEvents.aggregate.mockResolvedValue([]);
    mockRollupUpsert.mockResolvedValue({});

    const result = await rollupCompletedProductAnalyticsDays();

    expect(result.daysProcessed).toBe(2);
    expect(dbMock.orm.ProductAnalyticsEvents.aggregate).toHaveBeenCalledTimes(
      4,
    );
  });

  it("deletes raw events older than the retention window", async () => {
    mockEventsDeleteAndCount.mockResolvedValue(42);

    const result = await deleteExpiredProductAnalyticsEvents();

    expect(result.deleted).toBe(42);
    expect(result.cutoff).toEqual(new Date("2026-05-18T00:00:00.000Z"));
    expect(mockEventsDeleteAndCount).toHaveBeenCalled();
  });
});
