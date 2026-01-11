import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminUser } from "src/lib/admin-helpers";
import { prisma } from "src/lib/db";

interface TopUser {
  user_id: number;
  count: number;
}

interface GrowthDataPoint {
  month: string;
  count: number;
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalCrates: number;
    totalReleases: number;
  };
  recentActivity: {
    last7Days: {
      newUsers: number;
      newCrates: number;
      newReleases: number;
    };
    last30Days: {
      newUsers: number;
      newCrates: number;
      newReleases: number;
    };
  };
  topUsers: {
    byCrates: TopUser[];
    byReleases: TopUser[];
  };
  growth: {
    users: GrowthDataPoint[];
    crates: GrowthDataPoint[];
    releases: GrowthDataPoint[];
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get OAuth tokens from cookies (httpOnly, so harder to tamper with)
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    // Securely verify admin status by verifying identity with Discogs API
    // This prevents cookie tampering attacks
    const isAdmin = await verifyAdminUser(accessToken, accessTokenSecret);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get overview stats
    const [uniqueUsers, totalCrates, totalReleases] = await Promise.all([
      prisma.crate.groupBy({
        by: ["user_id"],
        _count: true,
      }),
      prisma.crate.count(),
      prisma.crateRelease.count(),
    ]);

    const totalUsers = uniqueUsers.length;

    // Calculate date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent activity
    const [
      cratesLast7Days,
      cratesLast30Days,
      releasesLast7Days,
      releasesLast30Days,
    ] = await Promise.all([
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
    ]);

    // Get new users (users who created their first crate in the period)
    // First, get all users' first crate dates
    const allUserFirstCrates = await prisma.crate.groupBy({
      by: ["user_id"],
      _min: {
        created_at: true,
      },
    });

    // Filter to find users whose first crate was created in the period
    const firstCratesLast7Days = allUserFirstCrates.filter((user) => {
      const firstCrateDate = user._min.created_at;
      return firstCrateDate && firstCrateDate >= sevenDaysAgo;
    });

    const firstCratesLast30Days = allUserFirstCrates.filter((user) => {
      const firstCrateDate = user._min.created_at;
      return firstCrateDate && firstCrateDate >= thirtyDaysAgo;
    });

    // Get top users by crate count
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

    // Get top users by release count
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

    // Get growth data - group by month
    // Get all crates with their creation dates
    const allCrates = await prisma.crate.findMany({
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const allReleases = await prisma.crateRelease.findMany({
      select: {
        added_at: true,
      },
      orderBy: {
        added_at: "asc",
      },
    });

    // Group by month
    const groupByMonth = (dates: Date[]): GrowthDataPoint[] => {
      const grouped = new Map<string, number>();

      dates.forEach((date) => {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        grouped.set(monthKey, (grouped.get(monthKey) || 0) + 1);
      });

      return Array.from(grouped.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
    };

    // Calculate cumulative users over time
    const userFirstCrates = await prisma.crate.groupBy({
      by: ["user_id"],
      _min: {
        created_at: true,
      },
    });

    const userGrowthDates = userFirstCrates
      .map((u) => u._min.created_at)
      .filter((d): d is Date => d !== null);

    const stats: AdminStats = {
      overview: {
        totalUsers,
        totalCrates,
        totalReleases,
      },
      recentActivity: {
        last7Days: {
          newUsers: firstCratesLast7Days.length,
          newCrates: cratesLast7Days,
          newReleases: releasesLast7Days,
        },
        last30Days: {
          newUsers: firstCratesLast30Days.length,
          newCrates: cratesLast30Days,
          newReleases: releasesLast30Days,
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
