import { Prisma } from "@prisma/client";
import { prisma } from "src/lib/db";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";

export const PRODUCT_ANALYTICS_RETENTION_DAYS = 90;
export const MAX_ROLLUP_DAYS_PER_RUN = 120;

export type ProductAnalyticsRollupDimension = "page_path" | "event";

export interface ProductAnalyticsMaintenanceResult {
  rollup: {
    daysProcessed: number;
    pagePathRows: number;
    eventRows: number;
  };
  retention: {
    deleted: number;
    cutoff: string;
  };
}

const bulkUpsertRollupRows = async ({
  dayStart,
  dimensionType,
  rows,
}: {
  dayStart: Date;
  dimensionType: ProductAnalyticsRollupDimension;
  rows: Array<{ key: string; count: number }>;
}) => {
  if (rows.length === 0) {
    return 0;
  }

  const values = rows.map(
    (row) =>
      Prisma.sql`(${dayStart}::date, ${dimensionType}, ${row.key}, ${row.count})`,
  );

  await prisma.$executeRaw`
    INSERT INTO product_analytics_daily_rollups (date, dimension_type, dimension_key, event_count)
    VALUES ${Prisma.join(values)}
    ON CONFLICT (date, dimension_type, dimension_key)
    DO UPDATE SET event_count = EXCLUDED.event_count
  `;

  return rows.length;
};

export const rollupProductAnalyticsForDay = async (
  dayStart: Date,
): Promise<{ pagePathRows: number; eventRows: number }> => {
  const dayEnd = addUtcDays(dayStart, 1);

  const [pageViews, interactions] = await Promise.all([
    prisma.productAnalyticsEvent.groupBy({
      by: ["page_path"],
      where: {
        event: "pageView",
        page_path: { not: null },
        created_at: { gte: dayStart, lt: dayEnd },
      },
      _count: { _all: true },
    }),
    prisma.productAnalyticsEvent.groupBy({
      by: ["event"],
      where: {
        event: { not: "pageView" },
        created_at: { gte: dayStart, lt: dayEnd },
      },
      _count: { _all: true },
    }),
  ]);

  const pagePathRows = await bulkUpsertRollupRows({
    dayStart,
    dimensionType: "page_path",
    rows: pageViews.flatMap((row) =>
      row.page_path ? [{ key: row.page_path, count: row._count._all }] : [],
    ),
  });

  const eventRows = await bulkUpsertRollupRows({
    dayStart,
    dimensionType: "event",
    rows: interactions.flatMap((row) =>
      row.event ? [{ key: row.event, count: row._count._all }] : [],
    ),
  });

  return { pagePathRows, eventRows };
};

const resolveRollupStartDay = async (): Promise<Date | null> => {
  const lastRollup = await prisma.productAnalyticsDailyRollup.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (lastRollup) {
    return addUtcDays(startOfUtcDay(lastRollup.date), 1);
  }

  const startOfToday = startOfUtcDay(new Date());
  const oldestEvent = await prisma.productAnalyticsEvent.findFirst({
    where: { created_at: { lt: startOfToday } },
    orderBy: { created_at: "asc" },
    select: { created_at: true },
  });

  if (!oldestEvent) {
    return null;
  }

  return startOfUtcDay(oldestEvent.created_at);
};

export const rollupCompletedProductAnalyticsDays = async ({
  maxDays = MAX_ROLLUP_DAYS_PER_RUN,
}: {
  maxDays?: number;
} = {}): Promise<{
  daysProcessed: number;
  pagePathRows: number;
  eventRows: number;
}> => {
  const startOfToday = startOfUtcDay(new Date());
  const lastCompleteDay = addUtcDays(startOfToday, -1);
  const rollupStartDay = await resolveRollupStartDay();

  if (!rollupStartDay) {
    return { daysProcessed: 0, pagePathRows: 0, eventRows: 0 };
  }

  const daysToRollup: Date[] = [];
  let dayCursor =
    rollupStartDay.getTime() <= lastCompleteDay.getTime()
      ? rollupStartDay
      : lastCompleteDay;

  while (
    dayCursor.getTime() <= lastCompleteDay.getTime() &&
    daysToRollup.length < maxDays
  ) {
    daysToRollup.push(dayCursor);
    dayCursor = addUtcDays(dayCursor, 1);
  }

  const lastScheduledDay = daysToRollup.at(-1);
  if (
    lastScheduledDay?.getTime() !== lastCompleteDay.getTime() &&
    daysToRollup.length < maxDays
  ) {
    daysToRollup.push(lastCompleteDay);
  }

  let pagePathRows = 0;
  let eventRows = 0;

  for (const dayStart of daysToRollup) {
    const dayTotals = await rollupProductAnalyticsForDay(dayStart);
    pagePathRows += dayTotals.pagePathRows;
    eventRows += dayTotals.eventRows;
  }

  return {
    daysProcessed: daysToRollup.length,
    pagePathRows,
    eventRows,
  };
};

export const deleteExpiredProductAnalyticsEvents = async ({
  retentionDays = PRODUCT_ANALYTICS_RETENTION_DAYS,
}: {
  retentionDays?: number;
} = {}): Promise<{ deleted: number; cutoff: Date }> => {
  const cutoff = addUtcDays(startOfUtcDay(new Date()), -retentionDays);
  const result = await prisma.productAnalyticsEvent.deleteMany({
    where: { created_at: { lt: cutoff } },
  });

  return { deleted: result.count, cutoff };
};

export const runProductAnalyticsMaintenance =
  async (): Promise<ProductAnalyticsMaintenanceResult> => {
    const rollup = await rollupCompletedProductAnalyticsDays();
    const retention = await deleteExpiredProductAnalyticsEvents();

    return {
      rollup,
      retention: {
        deleted: retention.deleted,
        cutoff: retention.cutoff.toISOString(),
      },
    };
  };
