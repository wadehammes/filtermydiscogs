import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminUser } from "src/lib/admin-helpers";
import { prisma } from "src/lib/db";
import type {
  AdminStats,
  AdminStatsGrowthDataPoint,
} from "src/types/dashboard.types";

const cratesWithNotesWhere = {
  AND: [{ notes: { not: null } }, { NOT: { notes: "" } }],
};

const groupByMonth = (dates: Date[]): AdminStatsGrowthDataPoint[] => {
  const grouped = new Map<string, number>();

  dates.forEach((date) => {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    grouped.set(monthKey, (grouped.get(monthKey) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    const isAdmin = await verifyAdminUser(accessToken, accessTokenSecret);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCrates,
      totalReleases,
      publicCrates,
      packedEnabledCrates,
      cratesWithNotes,
      totalSetMarkers,
      packedReleases,
      usersLast7Days,
      usersLast30Days,
      cratesLast7Days,
      cratesLast30Days,
      releasesLast7Days,
      releasesLast30Days,
      publicCratesLast7Days,
      publicCratesLast30Days,
      setMarkersLast7Days,
      setMarkersLast30Days,
      packedReleasesLast7Days,
      packedReleasesLast30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.crate.count(),
      prisma.crateRelease.count(),
      prisma.crate.count({ where: { private: false } }),
      prisma.crate.count({ where: { packed_enabled: true } }),
      prisma.crate.count({ where: cratesWithNotesWhere }),
      prisma.crateSetMarker.count(),
      prisma.crateRelease.count({ where: { found_at: { not: null } } }),
      prisma.user.count({
        where: {
          created_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.crate.count({
        where: {
          created_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.crate.count({
        where: {
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.crateRelease.count({
        where: {
          added_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.crateRelease.count({
        where: {
          added_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.crate.count({
        where: {
          private: false,
          created_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.crate.count({
        where: {
          private: false,
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.crateSetMarker.count({
        where: {
          created_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.crateSetMarker.count({
        where: {
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.crateRelease.count({
        where: {
          found_at: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.crateRelease.count({
        where: {
          found_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const topUsersByCrates = await prisma.crate.groupBy({
      by: ["user_id"],
      _count: {
        user_id: true,
      },
      orderBy: {
        _count: {
          user_id: "desc",
        },
      },
      take: 10,
    });

    const topUsersByReleases = await prisma.crateRelease.groupBy({
      by: ["user_id"],
      _count: {
        user_id: true,
      },
      orderBy: {
        _count: {
          user_id: "desc",
        },
      },
      take: 10,
    });

    const [allUsers, allCrates, allReleases, allPublicCrates, allSetMarkers] =
      await Promise.all([
        prisma.user.findMany({
          select: {
            created_at: true,
          },
          orderBy: {
            created_at: "asc",
          },
        }),
        prisma.crate.findMany({
          select: {
            created_at: true,
          },
          orderBy: {
            created_at: "asc",
          },
        }),
        prisma.crateRelease.findMany({
          select: {
            added_at: true,
          },
          orderBy: {
            added_at: "asc",
          },
        }),
        prisma.crate.findMany({
          where: {
            private: false,
          },
          select: {
            created_at: true,
          },
          orderBy: {
            created_at: "asc",
          },
        }),
        prisma.crateSetMarker.findMany({
          select: {
            created_at: true,
          },
          orderBy: {
            created_at: "asc",
          },
        }),
      ]);

    const userGrowthDates = allUsers.map((user) => user.created_at);

    const stats: AdminStats = {
      overview: {
        totalUsers,
        totalCrates,
        totalReleases,
        crateFeatures: {
          publicCrates,
          packedEnabledCrates,
          cratesWithNotes,
          totalSetMarkers,
          packedReleases,
        },
      },
      recentActivity: {
        last7Days: {
          newUsers: usersLast7Days,
          newCrates: cratesLast7Days,
          newReleases: releasesLast7Days,
          newPublicCrates: publicCratesLast7Days,
          newSetMarkers: setMarkersLast7Days,
          newPackedReleases: packedReleasesLast7Days,
        },
        last30Days: {
          newUsers: usersLast30Days,
          newCrates: cratesLast30Days,
          newReleases: releasesLast30Days,
          newPublicCrates: publicCratesLast30Days,
          newSetMarkers: setMarkersLast30Days,
          newPackedReleases: packedReleasesLast30Days,
        },
      },
      topUsers: {
        byCrates: topUsersByCrates.map((u) => ({
          user_id: u.user_id,
          count: u._count.user_id,
        })),
        byReleases: topUsersByReleases.map((u) => ({
          user_id: u.user_id,
          count: u._count.user_id,
        })),
      },
      growth: {
        users: groupByMonth(userGrowthDates),
        crates: groupByMonth(allCrates.map((c) => c.created_at)),
        releases: groupByMonth(allReleases.map((r) => r.added_at)),
        publicCrates: groupByMonth(allPublicCrates.map((c) => c.created_at)),
        setMarkers: groupByMonth(allSetMarkers.map((m) => m.created_at)),
      },
    };

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
