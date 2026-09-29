import { orm } from "src/lib/db";

export const fetchCrateReleaseCountsByCrateId = async ({
  userId,
  crateIds,
}: {
  userId: number;
  crateIds: string[];
}): Promise<Map<string, number>> => {
  if (crateIds.length === 0) {
    return new Map();
  }

  const rows = await orm.CrateReleases.where({ userId })
    .where((release) => release.crateId.in(crateIds))
    .groupBy("crateId")
    .aggregate((aggregate) => ({
      count: aggregate.count(),
    }));

  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.crateId, row.count);
  }

  return counts;
};
