import { unstable_cache } from "next/cache";
import { db, queryRawRows } from "src/lib/db";
import type { PublicCommunityStats } from "src/types/public-stats.types";

type PublicCommunityStatsRow = {
  totalCrates: number;
  totalPublicCrates: number;
  totalReleases: number;
  totalTracksSaved: number;
  totalCollectors: number;
  totalTrackPlays: number;
};

const fetchPublicCommunityStats = async (): Promise<PublicCommunityStats> => {
  const rows = await queryRawRows<PublicCommunityStatsRow>(
    db.raw.sql`
      SELECT
        (SELECT COUNT(*)::int FROM "crates") AS "totalCrates",
        (SELECT COUNT(*)::int FROM "crates" WHERE private = false) AS "totalPublicCrates",
        (SELECT COUNT(*)::int FROM "crate_releases") AS "totalReleases",
        (SELECT COUNT(*)::int FROM "user_tracks" WHERE youtube_id IS NOT NULL) AS "totalTracksSaved",
        (SELECT COUNT(DISTINCT user_id)::int FROM "crates") AS "totalCollectors",
        (SELECT COALESCE(SUM(play_count), 0)::int FROM "user_tracks") AS "totalTrackPlays"
    `
      .returnsRow({
        totalCrates: "pg/int4@1",
        totalPublicCrates: "pg/int4@1",
        totalReleases: "pg/int4@1",
        totalTracksSaved: "pg/int4@1",
        totalCollectors: "pg/int4@1",
        totalTrackPlays: "pg/int4@1",
      })
      .build(),
  );

  const row = rows[0];

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
    totalCollectors: row.totalCollectors,
    totalCrates: row.totalCrates,
    totalPublicCrates: row.totalPublicCrates,
    totalReleases: row.totalReleases,
    totalTracksSaved: row.totalTracksSaved,
    totalTrackPlays: row.totalTrackPlays,
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
