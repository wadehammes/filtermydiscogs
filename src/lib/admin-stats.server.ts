import { Prisma } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "src/lib/db";
import { fetchAdminFeatureUsageStats } from "src/lib/product-analytics.server";
import type {
  AdminStats,
  AdminStatsDailyCountPoint,
  AdminStatsGrowthDataPoint,
  AdminStatsRecentActivityPeriod,
  AdminStatsReturningUsersTimeSeries,
  AdminStatsTopUser,
} from "src/types/dashboard.types";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";
import { STORED_THEMES } from "src/utils/themeAppearance";

export const ADMIN_STATS_CACHE_SECONDS = 60;
export const RETURNING_USERS_SERIES_DAYS = 90;

type WindowCountRow = {
  last_7d: number;
  last_30d: number;
};

type UserOverviewRow = WindowCountRow & {
  total: number;
};

type CrateOverviewRow = WindowCountRow & {
  total: number;
  public_crates: number;
  packed_enabled_crates: number;
  crates_with_notes: number;
  public_last_7d: number;
  public_last_30d: number;
};

type ReleaseOverviewRow = WindowCountRow & {
  total: number;
  packed_total: number;
  packed_last_7d: number;
  packed_last_30d: number;
};

type SetMarkerOverviewRow = WindowCountRow & {
  total: number;
};

type AccountPreferencesBreakdownRow = {
  key: string;
  count: number;
};

type AccountPreferencesAnalyticsRow = {
  status: "enabled" | "disabled" | "unset";
  count: number;
};

type AccountPreferencesSavedViewsOverviewRow = {
  users_with_saved_views: number;
  total_saved_views: number;
};

const SAVED_VIEW_COUNT_BUCKETS = ["0", "1", "2-5", "6+"] as const;

const savedViewCountSql = Prisma.sql`
  CASE
    WHEN jsonb_typeof(preferences->'filterViews') = 'array'
    THEN jsonb_array_length(preferences->'filterViews')
    ELSE 0
  END
`;

const normalizeSavedViewsBreakdown = (
  rows: AccountPreferencesBreakdownRow[],
): AccountPreferencesBreakdownRow[] => {
  const counts = new Map(rows.map((row) => [row.key, row.count]));

  return SAVED_VIEW_COUNT_BUCKETS.map((key) => ({
    key,
    count: counts.get(key) ?? 0,
  }));
};

type TopUserRow = AdminStatsTopUser;

type GrowthRow = AdminStatsGrowthDataPoint;

const roundAverage = (numerator: number, denominator: number): number => {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10) / 10;
};

const countDistinctActiveUsers = async (since: Date): Promise<number> => {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT user_id FROM crates WHERE updated_at >= ${since}
      UNION
      SELECT user_id FROM crate_releases WHERE added_at >= ${since}
    ) active_users
  `;

  return rows[0]?.count ?? 0;
};

const fetchReturningUsersTimeSeries =
  async (): Promise<AdminStatsReturningUsersTimeSeries> => {
    const end = startOfUtcDay(new Date());
    const start = addUtcDays(end, -(RETURNING_USERS_SERIES_DAYS - 1));

    const rows = await prisma.$queryRaw<
      Array<{
        date: string;
        count_7d: number;
        count_30d: number;
        count_90d: number;
      }>
    >`
      WITH days AS (
        SELECT day::date AS day
        FROM generate_series(
          ${start}::date,
          ${end}::date,
          INTERVAL '1 day'
        ) AS day
      )
      SELECT
        to_char(days.day, 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (
          WHERE u.created_at < days.day - INTERVAL '7 days'
            AND u.updated_at >= days.day - INTERVAL '7 days'
            AND u.updated_at < days.day + INTERVAL '1 day'
        )::int AS count_7d,
        COUNT(*) FILTER (
          WHERE u.created_at < days.day - INTERVAL '30 days'
            AND u.updated_at >= days.day - INTERVAL '30 days'
            AND u.updated_at < days.day + INTERVAL '1 day'
        )::int AS count_30d,
        COUNT(*) FILTER (
          WHERE u.created_at < days.day - INTERVAL '90 days'
            AND u.updated_at >= days.day - INTERVAL '90 days'
            AND u.updated_at < days.day + INTERVAL '1 day'
        )::int AS count_90d
      FROM days
      CROSS JOIN users u
      GROUP BY days.day
      ORDER BY days.day
    `;

    const last7Days: AdminStatsDailyCountPoint[] = [];
    const last30Days: AdminStatsDailyCountPoint[] = [];
    const last90Days: AdminStatsDailyCountPoint[] = [];

    for (const row of rows) {
      last7Days.push({ date: row.date, count: row.count_7d });
      last30Days.push({ date: row.date, count: row.count_30d });
      last90Days.push({ date: row.date, count: row.count_90d });
    }

    return { last7Days, last30Days, last90Days };
  };

export const fetchAdminEngagementStats = async ({
  sevenDaysAgo,
  thirtyDaysAgo,
  ninetyDaysAgo,
  totalCrates,
  totalReleases,
}: {
  sevenDaysAgo: Date;
  thirtyDaysAgo: Date;
  ninetyDaysAgo: Date;
  totalCrates: number;
  totalReleases: number;
}) => {
  const [
    activeUsersLast7Days,
    activeUsersLast30Days,
    returningUsersLast7Days,
    returningUsersLast30Days,
    usersWithNoCrates,
    usersWithCrates,
    staleAccounts,
    returningUsersTimeSeries,
  ] = await Promise.all([
    countDistinctActiveUsers(sevenDaysAgo),
    countDistinctActiveUsers(thirtyDaysAgo),
    prisma.user.count({
      where: {
        updated_at: { gte: sevenDaysAgo },
        created_at: { lt: sevenDaysAgo },
      },
    }),
    prisma.user.count({
      where: {
        updated_at: { gte: thirtyDaysAgo },
        created_at: { lt: thirtyDaysAgo },
      },
    }),
    prisma.user.count({
      where: { crates: { none: {} } },
    }),
    prisma.user.count({
      where: { crates: { some: {} } },
    }),
    prisma.user.count({
      where: {
        crates: { some: {} },
        NOT: {
          OR: [
            { crates: { some: { updated_at: { gte: ninetyDaysAgo } } } },
            {
              crates: {
                some: {
                  releases: { some: { added_at: { gte: ninetyDaysAgo } } },
                },
              },
            },
          ],
        },
      },
    }),
    fetchReturningUsersTimeSeries(),
  ]);

  return {
    activeUsers: {
      last7Days: activeUsersLast7Days,
      last30Days: activeUsersLast30Days,
    },
    returningUsers: {
      last7Days: returningUsersLast7Days,
      last30Days: returningUsersLast30Days,
    },
    returningUsersTimeSeries,
    signupFunnel: {
      usersWithNoCrates,
      usersWithCrates,
    },
    averages: {
      cratesPerUser: roundAverage(totalCrates, usersWithCrates),
      releasesPerCrate: roundAverage(totalReleases, totalCrates),
    },
    staleAccounts,
  };
};

const buildRecentActivityPeriod = ({
  users,
  crates,
  releases,
  publicCrates,
  setMarkers,
  packedReleases,
  window,
}: {
  users: UserOverviewRow;
  crates: CrateOverviewRow;
  releases: ReleaseOverviewRow;
  publicCrates: Pick<CrateOverviewRow, "public_last_7d" | "public_last_30d">;
  setMarkers: SetMarkerOverviewRow;
  packedReleases: Pick<
    ReleaseOverviewRow,
    "packed_last_7d" | "packed_last_30d"
  >;
  window: "last_7d" | "last_30d";
}): AdminStatsRecentActivityPeriod => ({
  newUsers: users[window],
  newCrates: crates[window],
  newReleases: releases[window],
  newPublicCrates: publicCrates[`public_${window}`],
  newSetMarkers: setMarkers[window],
  newPackedReleases: packedReleases[`packed_${window}`],
});

const emptyFeatureUsage = (): AdminStats["featureUsage"] => ({
  totals: { last7Days: 0, last30Days: 0 },
  pageViews: [],
  events: [],
});

const mapAnalyticsConsentCounts = (
  rows: AccountPreferencesAnalyticsRow[],
): AdminStats["accountPreferences"]["analyticsConsent"] => {
  const counts = {
    enabled: 0,
    disabled: 0,
    unset: 0,
  };

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
};

export const fetchAdminAccountPreferencesStats = async (): Promise<
  AdminStats["accountPreferences"]
> => {
  const storedThemeSqlList = Prisma.join(
    STORED_THEMES.map((theme) => Prisma.sql`${theme}`),
  );

  const [
    persistFiltersRows,
    analyticsRows,
    themeRows,
    viewRows,
    savedViewsOverviewRows,
    savedViewsBreakdownRows,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE COALESCE((preferences->>'persistFilters')::boolean, true) = true
      `,
    prisma.$queryRaw<AccountPreferencesAnalyticsRow[]>`
        SELECT
          CASE
            WHEN preferences->'analyticsConsent' IS NULL THEN 'unset'
            WHEN (preferences->>'analyticsConsent')::boolean = true THEN 'enabled'
            ELSE 'disabled'
          END AS status,
          COUNT(*)::int AS count
        FROM users
        GROUP BY 1
      `,
    prisma.$queryRaw<AccountPreferencesBreakdownRow[]>`
        SELECT
          CASE
            WHEN preferences->>'theme' IN (${storedThemeSqlList}) THEN preferences->>'theme'
            ELSE 'light'
          END AS key,
          COUNT(*)::int AS count
        FROM users
        GROUP BY 1
        ORDER BY count DESC, key ASC
      `,
    prisma.$queryRaw<AccountPreferencesBreakdownRow[]>`
        SELECT
          CASE
            WHEN preferences->'view'->>'currentView' IN ('card', 'list', 'random')
            THEN preferences->'view'->>'currentView'
            ELSE 'card'
          END AS key,
          COUNT(*)::int AS count
        FROM users
        GROUP BY 1
        ORDER BY count DESC, key ASC
      `,
    prisma.$queryRaw<AccountPreferencesSavedViewsOverviewRow[]>`
        SELECT
          COUNT(*) FILTER (WHERE ${savedViewCountSql} > 0)::int AS users_with_saved_views,
          COALESCE(SUM(${savedViewCountSql}), 0)::int AS total_saved_views
        FROM users
      `,
    prisma.$queryRaw<AccountPreferencesBreakdownRow[]>`
        WITH view_counts AS (
          SELECT ${savedViewCountSql} AS view_count
          FROM users
        )
        SELECT
          CASE
            WHEN view_count = 0 THEN '0'
            WHEN view_count = 1 THEN '1'
            WHEN view_count BETWEEN 2 AND 5 THEN '2-5'
            ELSE '6+'
          END AS key,
          COUNT(*)::int AS count
        FROM view_counts
        GROUP BY 1
        ORDER BY MIN(view_count)
      `,
  ]);

  const savedViewsOverview = savedViewsOverviewRows[0];

  return {
    persistFiltersEnabled: persistFiltersRows[0]?.count ?? 0,
    analyticsConsent: mapAnalyticsConsentCounts(analyticsRows),
    themes: themeRows,
    defaultViews: viewRows,
    savedViews: {
      usersWithSavedViews: savedViewsOverview?.users_with_saved_views ?? 0,
      totalSavedViews: savedViewsOverview?.total_saved_views ?? 0,
      countBreakdown: normalizeSavedViewsBreakdown(savedViewsBreakdownRows),
    },
  };
};

const fetchAdminStatsUncached = async (): Promise<AdminStats> => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    usersOverview,
    cratesOverview,
    releasesOverview,
    setMarkersOverview,
    topUsersByCrates,
    topUsersByReleases,
    userGrowth,
    crateGrowth,
    releaseGrowth,
    publicCrateGrowth,
    setMarkerGrowth,
    featureUsage,
    accountPreferences,
  ] = await Promise.all([
    prisma.$queryRaw<UserOverviewRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int AS last_7d,
        COUNT(*) FILTER (WHERE created_at >= ${thirtyDaysAgo})::int AS last_30d
      FROM users
    `,
    prisma.$queryRaw<CrateOverviewRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE private = false)::int AS public_crates,
        COUNT(*) FILTER (WHERE packed_enabled = true)::int AS packed_enabled_crates,
        COUNT(*) FILTER (WHERE notes IS NOT NULL AND notes <> '')::int AS crates_with_notes,
        COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int AS last_7d,
        COUNT(*) FILTER (WHERE created_at >= ${thirtyDaysAgo})::int AS last_30d,
        COUNT(*) FILTER (WHERE private = false AND created_at >= ${sevenDaysAgo})::int AS public_last_7d,
        COUNT(*) FILTER (WHERE private = false AND created_at >= ${thirtyDaysAgo})::int AS public_last_30d
      FROM crates
    `,
    prisma.$queryRaw<ReleaseOverviewRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE added_at >= ${sevenDaysAgo})::int AS last_7d,
        COUNT(*) FILTER (WHERE added_at >= ${thirtyDaysAgo})::int AS last_30d,
        COUNT(*) FILTER (WHERE found_at IS NOT NULL)::int AS packed_total,
        COUNT(*) FILTER (WHERE found_at >= ${sevenDaysAgo})::int AS packed_last_7d,
        COUNT(*) FILTER (WHERE found_at >= ${thirtyDaysAgo})::int AS packed_last_30d
      FROM crate_releases
    `,
    prisma.$queryRaw<SetMarkerOverviewRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int AS last_7d,
        COUNT(*) FILTER (WHERE created_at >= ${thirtyDaysAgo})::int AS last_30d
      FROM crate_set_markers
    `,
    prisma.$queryRaw<TopUserRow[]>`
      SELECT
        c.user_id,
        u.username,
        COUNT(*)::int AS count
      FROM crates c
      INNER JOIN users u ON u.discogs_user_id = c.user_id
      GROUP BY c.user_id, u.username
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw<TopUserRow[]>`
      SELECT
        cr.user_id,
        u.username,
        COUNT(*)::int AS count
      FROM crate_releases cr
      INNER JOIN users u ON u.discogs_user_id = cr.user_id
      GROUP BY cr.user_id, u.username
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM users
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM crates
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT
        to_char(date_trunc('month', added_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM crate_releases
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM crates
      WHERE private = false
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM crate_set_markers
      GROUP BY 1
      ORDER BY 1
    `,
    fetchAdminFeatureUsageStats().catch((error) => {
      console.error("Admin feature usage stats error:", error);
      return emptyFeatureUsage();
    }),
    fetchAdminAccountPreferencesStats(),
  ]);

  const users = usersOverview[0];
  const crates = cratesOverview[0];
  const releases = releasesOverview[0];
  const setMarkers = setMarkersOverview[0];

  if (!(users && crates && releases && setMarkers)) {
    throw new Error("Failed to load admin overview stats");
  }

  const engagement = await fetchAdminEngagementStats({
    sevenDaysAgo,
    thirtyDaysAgo,
    ninetyDaysAgo,
    totalCrates: crates.total,
    totalReleases: releases.total,
  });

  return {
    overview: {
      totalUsers: users.total,
      totalCrates: crates.total,
      totalReleases: releases.total,
      crateFeatures: {
        publicCrates: crates.public_crates,
        packedEnabledCrates: crates.packed_enabled_crates,
        cratesWithNotes: crates.crates_with_notes,
        totalSetMarkers: setMarkers.total,
        packedReleases: releases.packed_total,
      },
    },
    engagement,
    accountPreferences,
    featureUsage,
    recentActivity: {
      last7Days: buildRecentActivityPeriod({
        users,
        crates,
        releases,
        publicCrates: crates,
        setMarkers,
        packedReleases: releases,
        window: "last_7d",
      }),
      last30Days: buildRecentActivityPeriod({
        users,
        crates,
        releases,
        publicCrates: crates,
        setMarkers,
        packedReleases: releases,
        window: "last_30d",
      }),
    },
    topUsers: {
      byCrates: topUsersByCrates,
      byReleases: topUsersByReleases,
    },
    growth: {
      users: userGrowth,
      crates: crateGrowth,
      releases: releaseGrowth,
      publicCrates: publicCrateGrowth,
      setMarkers: setMarkerGrowth,
    },
  };
};

async function getCachedAdminStats(): Promise<AdminStats> {
  "use cache";
  cacheLife({ revalidate: ADMIN_STATS_CACHE_SECONDS });
  cacheTag("admin-stats");

  return fetchAdminStatsUncached();
}

export const getAdminStats = async (): Promise<AdminStats> =>
  getCachedAdminStats();
