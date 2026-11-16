import { prisma } from "src/lib/db";
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

  await prisma.productAnalyticsEvent.createMany({
    data: events.map((event) => ({
      event: event.event,
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value ?? null,
      page_path: event.page_path ?? null,
      user_id: userId,
    })),
  });
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
    dimension_key: string;
    _sum: { event_count: number | null };
  }>,
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.dimension_key, row._sum.event_count ?? 0);
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

const groupPageViewCounts = (
  rows: Array<{
    page_path?: string | null;
    _count: { _all: number };
  }>,
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.page_path) {
      continue;
    }

    counts.set(row.page_path, row._count._all);
  }

  return counts;
};

export const fetchAdminFeatureUsageStats =
  async (): Promise<AdminStatsFeatureUsage> => {
    const startOfToday = startOfUtcDay(new Date());
    const rawSupplementStart = addUtcDays(startOfToday, -1);
    const sevenDayRollupStart = addUtcDays(startOfToday, -6);
    const thirtyDayRollupStart = addUtcDays(startOfToday, -29);
    const rolledUpThrough = { lt: rawSupplementStart };

    const [
      totalRollup7d,
      totalRollup30d,
      pageViewsRollup7d,
      pageViewsRollup30d,
      rawTotalSinceYesterday,
      rawPageViewsSinceYesterday,
    ] = await Promise.all([
      prisma.productAnalyticsDailyRollup.aggregate({
        where: { date: { gte: sevenDayRollupStart, ...rolledUpThrough } },
        _sum: { event_count: true },
      }),
      prisma.productAnalyticsDailyRollup.aggregate({
        where: { date: { gte: thirtyDayRollupStart, ...rolledUpThrough } },
        _sum: { event_count: true },
      }),
      prisma.productAnalyticsDailyRollup.groupBy({
        by: ["dimension_key"],
        where: {
          dimension_type: "page_path",
          date: { gte: sevenDayRollupStart, ...rolledUpThrough },
        },
        _sum: { event_count: true },
      }),
      prisma.productAnalyticsDailyRollup.groupBy({
        by: ["dimension_key"],
        where: {
          dimension_type: "page_path",
          date: { gte: thirtyDayRollupStart, ...rolledUpThrough },
        },
        _sum: { event_count: true },
      }),
      prisma.productAnalyticsEvent.count({
        where: { created_at: { gte: rawSupplementStart } },
      }),
      prisma.productAnalyticsEvent.groupBy({
        by: ["page_path"],
        where: {
          event: "pageView",
          page_path: { not: null },
          created_at: { gte: rawSupplementStart },
        },
        _count: { _all: true },
      }),
    ]);

    const rawPageViewCounts = groupPageViewCounts(rawPageViewsSinceYesterday);
    const rawSupplementTotal = rawTotalSinceYesterday;

    return {
      totals: {
        last7Days: (totalRollup7d._sum.event_count ?? 0) + rawSupplementTotal,
        last30Days: (totalRollup30d._sum.event_count ?? 0) + rawSupplementTotal,
      },
      events: [],
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
    };
  };
