import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "src/lib/db";
import { fetchAdminFeatureUsageStats } from "src/lib/product-analytics.server";
import type {
  AdminStats,
  AdminStatsDailyCountPoint,
  AdminStatsGrowthDataPoint,
  AdminStatsRecentActivityPeriod,
  AdminStatsReturningUsersTimeSeries,
} from "src/types/dashboard.types";
import { addUtcDays, startOfUtcDay } from "src/utils/dateHelpers";

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

type GrowthRow = {
  month: string;
  count: number;
};

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

const mapGrowthRows = (rows: GrowthRow[]): AdminStatsGrowthDataPoint[] =>
  rows.map((row) => ({
    month: row.month,
    count: row.count,
  }));

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
    prisma.crate.groupBy({
      by: ["user_id"],
      _count: { user_id: true },
      orderBy: { _count: { user_id: "desc" } },
      take: 10,
    }),
    prisma.crateRelease.groupBy({
      by: ["user_id"],
      _count: { user_id: true },
      orderBy: { _count: { user_id: "desc" } },
      take: 10,
    }),
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
      byCrates: topUsersByCrates.map((entry) => ({
        user_id: entry.user_id,
        count: entry._count.user_id,
      })),
      byReleases: topUsersByReleases.map((entry) => ({
        user_id: entry.user_id,
        count: entry._count.user_id,
      })),
    },
    growth: {
      users: mapGrowthRows(userGrowth),
      crates: mapGrowthRows(crateGrowth),
      releases: mapGrowthRows(releaseGrowth),
      publicCrates: mapGrowthRows(publicCrateGrowth),
      setMarkers: mapGrowthRows(setMarkerGrowth),
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
