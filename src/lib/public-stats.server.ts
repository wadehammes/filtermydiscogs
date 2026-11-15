import { cacheLife, cacheTag } from "next/cache";
import { readRuntimeDatabaseUrlFromEnv } from "src/lib/databaseUrlEnv";
import { prisma } from "src/lib/db";
import type { PublicCommunityStats } from "src/types/public-stats.types";

export const PUBLIC_COMMUNITY_STATS_CACHE_TAG = "public-community-stats";

type PublicCommunityStatsRow = {
  totalCrates: bigint;
  totalPublicCrates: bigint;
  totalPlaylists: bigint;
  totalPublicPlaylists: bigint;
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
      (SELECT COUNT(*)::bigint FROM "playlists") AS "totalPlaylists",
      (SELECT COUNT(*)::bigint FROM "playlists" WHERE private = false) AS "totalPublicPlaylists",
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
      totalPlaylists: 0,
      totalPublicPlaylists: 0,
      totalReleases: 0,
      totalTracksSaved: 0,
      totalTrackPlays: 0,
    };
  }

  return {
    totalCollectors: Number(row.totalCollectors),
    totalCrates: Number(row.totalCrates),
    totalPublicCrates: Number(row.totalPublicCrates),
    totalPlaylists: Number(row.totalPlaylists),
    totalPublicPlaylists: Number(row.totalPublicPlaylists),
    totalReleases: Number(row.totalReleases),
    totalTracksSaved: Number(row.totalTracksSaved),
    totalTrackPlays: Number(row.totalTrackPlays),
  };
};

const getCachedPublicCommunityStats =
  async (): Promise<PublicCommunityStats> => {
    "use cache";
    cacheLife({ revalidate: 60 });
    cacheTag(PUBLIC_COMMUNITY_STATS_CACHE_TAG);

    return fetchPublicCommunityStats();
  };

export const getPublicCommunityStats =
  async (): Promise<PublicCommunityStats | null> => {
    if (!readRuntimeDatabaseUrlFromEnv()) {
      return null;
    }

    try {
      return await getCachedPublicCommunityStats();
    } catch {
      return null;
    }
  };
