import { and } from "@prisma/orm-postgres/orm-client";
import { orm, ormDate, ormTimestamp, toOrmDate } from "src/lib/db";
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

  await Promise.all(
    rows.map((row) =>
      orm.ProductAnalyticsDailyRollups.upsert({
        create: {
          date: ormDate(dayStart),
          dimensionType,
          dimensionKey: row.key,
          eventCount: row.count,
        },
        update: {
          eventCount: row.count,
        },
        conflictOn: {
          date: ormDate(dayStart),
          dimensionType,
          dimensionKey: row.key,
        },
      }),
    ),
  );

  return rows.length;
};

export const rollupProductAnalyticsForDay = async (
  dayStart: Date,
): Promise<{ pagePathRows: number; eventRows: number }> => {
  const dayEnd = addUtcDays(dayStart, 1);

  const [pageViews, interactions] = await Promise.all([
    orm.ProductAnalyticsEvents.where((event) =>
      and(
        event.event.eq("pageView"),
        event.pagePath.isNotNull(),
        event.createdAt.gte(ormTimestamp(dayStart)),
        event.createdAt.lt(ormTimestamp(dayEnd)),
      ),
    )
      .groupBy("pagePath")
      .aggregate((aggregate) => ({
        count: aggregate.count(),
      })),
    orm.ProductAnalyticsEvents.where((event) =>
      and(
        event.event.neq("pageView"),
        event.createdAt.gte(ormTimestamp(dayStart)),
        event.createdAt.lt(ormTimestamp(dayEnd)),
      ),
    )
      .groupBy("event")
      .aggregate((aggregate) => ({
        count: aggregate.count(),
      })),
  ]);

  const pagePathRows = await bulkUpsertRollupRows({
    dayStart,
    dimensionType: "page_path",
    rows: pageViews.flatMap((row) =>
      row.pagePath ? [{ key: row.pagePath, count: row.count }] : [],
    ),
  });

  const eventRows = await bulkUpsertRollupRows({
    dayStart,
    dimensionType: "event",
    rows: interactions.flatMap((row) =>
      row.event ? [{ key: row.event, count: row.count }] : [],
    ),
  });

  return { pagePathRows, eventRows };
};

const resolveRollupStartDay = async (): Promise<Date | null> => {
  const lastRollup = await orm.ProductAnalyticsDailyRollups.orderBy((rollup) =>
    rollup.date.desc(),
  )
    .select("date")
    .first();

  if (lastRollup) {
    return addUtcDays(startOfUtcDay(toOrmDate(lastRollup.date)), 1);
  }

  const startOfToday = startOfUtcDay(new Date());
  const oldestEvent = await orm.ProductAnalyticsEvents.where((event) =>
    event.createdAt.lt(ormTimestamp(startOfToday)),
  )
    .orderBy((event) => event.createdAt.asc())
    .select("createdAt")
    .first();

  if (!oldestEvent) {
    return null;
  }

  return startOfUtcDay(toOrmDate(oldestEvent.createdAt));
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
  const deleted = await orm.ProductAnalyticsEvents.where((event) =>
    event.createdAt.lt(ormTimestamp(cutoff)),
  ).deleteAndCount();

  return { deleted, cutoff };
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
