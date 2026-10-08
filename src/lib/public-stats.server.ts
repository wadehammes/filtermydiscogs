import { unstable_cache } from "next/cache";
import { prisma } from "src/lib/db";
import type { PublicCommunityStats } from "src/types/public-stats.types";

type PublicCommunityStatsRow = {
  totalCrates: bigint;
  totalPublicCrates: bigint;
  totalReleases: bigint;
  totalTracksSaved: bigint;
  totalCollectors: bigint;
  totalTrackPlays: bigint;
};

const fetchPublicCommunityStats = async (): Promise<PublicCommunityStats> => {
  const [row] = await prisma.$queryRaw<PublicCommunityStatsRow[]>`
    SELECT
      (SELECT COUNT(*)::bigint FROM "crates") AS "totalCrates",
      (SELECT COUNT(*)::bigint FROM "crates" WHERE private = false) AS "totalPublicCrates",
      (SELECT COUNT(*)::bigint FROM "crate_releases") AS "totalReleases",
      (SELECT COUNT(*)::bigint FROM "user_tracks" WHERE youtube_id IS NOT NULL) AS "totalTracksSaved",
      (SELECT COUNT(DISTINCT user_id)::bigint FROM "crates") AS "totalCollectors",
      (SELECT COALESCE(SUM(play_count), 0)::bigint FROM "user_tracks") AS "totalTrackPlays"
  `;

  if (!row) {
    return {
      totalCollectors: 0,
      totalCrates: 0,
      totalPublicCrates: 0,
      totalReleases: 0,
      totalTracksSaved: 0,
      totalTrackPlays: 0,
    };
  }

  return {
    totalCollectors: Number(row.totalCollectors),
    totalCrates: Number(row.totalCrates),
    totalPublicCrates: Number(row.totalPublicCrates),
    totalReleases: Number(row.totalReleases),
    totalTracksSaved: Number(row.totalTracksSaved),
    totalTrackPlays: Number(row.totalTrackPlays),
  };
};

const getCachedPublicCommunityStats = unstable_cache(
  fetchPublicCommunityStats,
  ["public-community-stats"],
  {
    revalidate: 300,
    tags: ["public-community-stats"],
  },
);

export const getPublicCommunityStats =
  async (): Promise<PublicCommunityStats | null> => {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    try {
      return await getCachedPublicCommunityStats();
    } catch {
      return null;
    }
  };
