import { unstable_cache } from "next/cache";
import { prisma } from "src/lib/db";
import type { PublicCommunityStats } from "src/types/public-stats.types";

const fetchPublicCommunityStats = async (): Promise<PublicCommunityStats> => {
  const [totalCrates, totalReleases, collectors] = await Promise.all([
    prisma.crate.count(),
    prisma.crateRelease.count(),
    prisma.crate.groupBy({
      by: ["user_id"],
    }),
  ]);

  return {
    totalCollectors: collectors.length,
    totalCrates,
    totalReleases,
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
    try {
      return await getCachedPublicCommunityStats();
    } catch {
      return null;
    }
  };
