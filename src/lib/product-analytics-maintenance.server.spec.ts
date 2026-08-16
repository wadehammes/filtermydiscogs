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
      findFirst: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    productAnalyticsDailyRollup: {
      findFirst: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));

type DbModule = typeof import("src/lib/db");

let rollupProductAnalyticsForDay: typeof import("src/lib/product-analytics-maintenance.server")["rollupProductAnalyticsForDay"];
let rollupCompletedProductAnalyticsDays: typeof import("src/lib/product-analytics-maintenance.server")["rollupCompletedProductAnalyticsDays"];
let deleteExpiredProductAnalyticsEvents: typeof import("src/lib/product-analytics-maintenance.server")["deleteExpiredProductAnalyticsEvents"];
let mockFindFirst: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["findFirst"]
>;
let mockGroupBy: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]
>;
let mockDeleteMany: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsEvent"]["deleteMany"]
>;
let mockRollupFindFirst: jest.MockedFunction<
  DbModule["prisma"]["productAnalyticsDailyRollup"]["findFirst"]
>;
let mockExecuteRaw: jest.MockedFunction<DbModule["prisma"]["$executeRaw"]>;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-16T15:00:00.000Z"));

  const [maintenanceModule, db] = await Promise.all([
    import("src/lib/product-analytics-maintenance.server"),
    import("src/lib/db"),
  ]);

  rollupProductAnalyticsForDay = maintenanceModule.rollupProductAnalyticsForDay;
  rollupCompletedProductAnalyticsDays =
    maintenanceModule.rollupCompletedProductAnalyticsDays;
  deleteExpiredProductAnalyticsEvents =
    maintenanceModule.deleteExpiredProductAnalyticsEvents;
  mockFindFirst = jest.mocked(db.prisma.productAnalyticsEvent.findFirst);
  mockGroupBy = jest.mocked(db.prisma.productAnalyticsEvent.groupBy);
  mockDeleteMany = jest.mocked(db.prisma.productAnalyticsEvent.deleteMany);
  mockRollupFindFirst = jest.mocked(
    db.prisma.productAnalyticsDailyRollup.findFirst,
  );
  mockExecuteRaw = jest.mocked(db.prisma.$executeRaw);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("product analytics maintenance", () => {
  it("bulk upserts daily rollups for page views and interactions", async () => {
    mockGroupBy
      .mockResolvedValueOnce([
        { page_path: "/releases", _count: { _all: 12 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >)
      .mockResolvedValueOnce([
        { event: "releaseClicked", _count: { _all: 5 } },
      ] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >);
    mockExecuteRaw.mockResolvedValue(2);

    const dayStart = new Date("2026-08-15T00:00:00.000Z");
    const totals = await rollupProductAnalyticsForDay(dayStart);

    expect(totals).toEqual({ pagePathRows: 1, eventRows: 1 });
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it("rolls up from the last stored day through yesterday", async () => {
    mockRollupFindFirst.mockResolvedValue({
      date: new Date("2026-08-14T00:00:00.000Z"),
    } as Awaited<
      ReturnType<DbModule["prisma"]["productAnalyticsDailyRollup"]["findFirst"]>
    >);
    mockGroupBy.mockResolvedValue(
      [] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >,
    );
    mockExecuteRaw.mockResolvedValue(0);

    const result = await rollupCompletedProductAnalyticsDays();

    expect(result.daysProcessed).toBe(1);
    expect(mockGroupBy).toHaveBeenCalledTimes(2);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("backfills from the oldest raw event when no rollups exist", async () => {
    mockRollupFindFirst.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue({
      created_at: new Date("2026-08-14T10:00:00.000Z"),
    } as Awaited<
      ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["findFirst"]>
    >);
    mockGroupBy.mockResolvedValue(
      [] as Awaited<
        ReturnType<DbModule["prisma"]["productAnalyticsEvent"]["groupBy"]>
      >,
    );
    mockExecuteRaw.mockResolvedValue(0);

    const result = await rollupCompletedProductAnalyticsDays();

    expect(result.daysProcessed).toBe(2);
    expect(mockGroupBy).toHaveBeenCalledTimes(4);
  });

  it("deletes raw events older than the retention window", async () => {
    mockDeleteMany.mockResolvedValue({ count: 42 });

    const result = await deleteExpiredProductAnalyticsEvents();

    expect(result.deleted).toBe(42);
    expect(result.cutoff).toEqual(new Date("2026-05-18T00:00:00.000Z"));
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        created_at: { lt: new Date("2026-05-18T00:00:00.000Z") },
      },
    });
  });
});
