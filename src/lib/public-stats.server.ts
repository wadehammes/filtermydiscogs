import { unstable_cache } from "next/cache";
import { countRows, orm } from "src/lib/db";
import type { PublicCommunityStats } from "src/types/public-stats.types";

const fetchPublicCommunityStats = async (): Promise<PublicCommunityStats> => {
  const [totalCrates, totalPublicCrates, totalReleases, collectors] =
    await Promise.all([
      countRows(orm.Crates),
      countRows(orm.Crates.where({ private: false })),
      countRows(orm.CrateReleases),
      orm.Crates.groupBy("userId").aggregate((aggregate) => ({
        n: aggregate.count(),
      })),
    ]);

  return {
    totalCollectors: collectors.length,
    totalCrates,
    totalPublicCrates,
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
