import { randomUUID } from "node:crypto";
import { and } from "@prisma/orm-postgres/orm-client";
import { countRows, orm, ormDate, ormTimestamp } from "src/lib/db";
import type {
  AdminStatsFeatureUsage,
  AdminStatsFeatureUsageRow,
  ProductAnalyticsEventInput,
} from "src/types/productAnalytics.types";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";

export { validateProductAnalyticsBatch } from "src/lib/validation/productAnalytics.schemas";

const TOP_ROW_LIMIT = 12;

export const insertProductAnalyticsEvents = async (
  events: ProductAnalyticsEventInput[],
  userId: number | null,
) => {
  if (events.length === 0) {
    return;
  }

  await orm.ProductAnalyticsEvents.createAll(
    events.map((event) => ({
      id: randomUUID(),
      event: event.event,
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value ?? null,
      pagePath: event.page_path ?? null,
      userId,
    })),
  );
};

const buildUsageRows = ({
  sevenDayCounts,
  thirtyDayCounts,
  labelForKey,
}: {
  sevenDayCounts: Map<string, number>;
  thirtyDayCounts: Map<string, number>;
  labelForKey: (key: string) => string;
}): AdminStatsFeatureUsageRow[] => {
  const keys = new Set([...sevenDayCounts.keys(), ...thirtyDayCounts.keys()]);

  return [...keys]
    .map((key) => ({
      key,
      label: labelForKey(key),
      last7Days: sevenDayCounts.get(key) ?? 0,
      last30Days: thirtyDayCounts.get(key) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.last30Days - left.last30Days || right.last7Days - left.last7Days,
    )
    .slice(0, TOP_ROW_LIMIT);
};

const groupRollupCounts = (
  rows: Array<{
    dimensionKey: string;
    count: number | null;
  }>,
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.dimensionKey, row.count ?? 0);
  }

  return counts;
};

const mergeCountMaps = (
  left: Map<string, number>,
  right: Map<string, number>,
): Map<string, number> => {
  const merged = new Map(left);

  for (const [key, count] of right) {
    merged.set(key, (merged.get(key) ?? 0) + count);
  }

  return merged;
};

const groupCounts = (
  rows: Array<{
    event?: string;
    pagePath?: string | null;
    count: number;
  }>,
  key: "event" | "pagePath",
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = key === "event" ? row.event : row.pagePath;

    if (!value) {
      continue;
    }

    counts.set(value, row.count);
  }

  return counts;
};

const formatEventLabel = (eventName: string): string =>
  eventName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());

export const fetchAdminFeatureUsageStats =
  async (): Promise<AdminStatsFeatureUsage> => {
    const startOfToday = startOfUtcDay(new Date());
    const rawSupplementStart = addUtcDays(startOfToday, -1);
    const sevenDayRollupStart = addUtcDays(startOfToday, -6);
    const thirtyDayRollupStart = addUtcDays(startOfToday, -29);

    const [
      totalRollup7d,
      totalRollup30d,
      pageViewsRollup7d,
      pageViewsRollup30d,
      eventsRollup7d,
      eventsRollup30d,
      rawTotalSinceYesterday,
      rawPageViewsSinceYesterday,
      rawEventsSinceYesterday,
    ] = await Promise.all([
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.date.gte(ormDate(sevenDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      ).aggregate((aggregate) => ({
        total: aggregate.sum("eventCount"),
      })),
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.date.gte(ormDate(thirtyDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      ).aggregate((aggregate) => ({
        total: aggregate.sum("eventCount"),
      })),
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.dimensionType.eq("page_path"),
          rollup.date.gte(ormDate(sevenDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      )
        .groupBy("dimensionKey")
        .aggregate((aggregate) => ({
          count: aggregate.sum("eventCount"),
        })),
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.dimensionType.eq("page_path"),
          rollup.date.gte(ormDate(thirtyDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      )
        .groupBy("dimensionKey")
        .aggregate((aggregate) => ({
          count: aggregate.sum("eventCount"),
        })),
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.dimensionType.eq("event"),
          rollup.date.gte(ormDate(sevenDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      )
        .groupBy("dimensionKey")
        .aggregate((aggregate) => ({
          count: aggregate.sum("eventCount"),
        })),
      orm.ProductAnalyticsDailyRollups.where((rollup) =>
        and(
          rollup.dimensionType.eq("event"),
          rollup.date.gte(ormDate(thirtyDayRollupStart)),
          rollup.date.lt(ormDate(rawSupplementStart)),
        ),
      )
        .groupBy("dimensionKey")
        .aggregate((aggregate) => ({
          count: aggregate.sum("eventCount"),
        })),
      countRows(
        orm.ProductAnalyticsEvents.where((event) =>
          event.createdAt.gte(ormTimestamp(rawSupplementStart)),
        ),
      ),
      orm.ProductAnalyticsEvents.where((event) =>
        and(
          event.event.eq("pageView"),
          event.pagePath.isNotNull(),
          event.createdAt.gte(ormTimestamp(rawSupplementStart)),
        ),
      )
        .groupBy("pagePath")
        .aggregate((aggregate) => ({
          count: aggregate.count(),
        })),
      orm.ProductAnalyticsEvents.where((event) =>
        and(
          event.event.neq("pageView"),
          event.createdAt.gte(ormTimestamp(rawSupplementStart)),
        ),
      )
        .groupBy("event")
        .aggregate((aggregate) => ({
          count: aggregate.count(),
        })),
    ]);

    const rawPageViewCounts = groupCounts(
      rawPageViewsSinceYesterday,
      "pagePath",
    );
    const rawEventCounts = groupCounts(rawEventsSinceYesterday, "event");

    return {
      totals: {
        last7Days: (totalRollup7d.total ?? 0) + rawTotalSinceYesterday,
        last30Days: (totalRollup30d.total ?? 0) + rawTotalSinceYesterday,
      },
      pageViews: buildUsageRows({
        sevenDayCounts: mergeCountMaps(
          groupRollupCounts(pageViewsRollup7d),
          rawPageViewCounts,
        ),
        thirtyDayCounts: mergeCountMaps(
          groupRollupCounts(pageViewsRollup30d),
          rawPageViewCounts,
        ),
        labelForKey: (key) => key,
      }),
      events: buildUsageRows({
        sevenDayCounts: mergeCountMaps(
          groupRollupCounts(eventsRollup7d),
          rawEventCounts,
        ),
        thirtyDayCounts: mergeCountMaps(
          groupRollupCounts(eventsRollup30d),
          rawEventCounts,
        ),
        labelForKey: formatEventLabel,
      }),
    };
  };
