import { groupPreviewThumbsByCrateId } from "src/lib/crate-preview";
import { orm } from "src/lib/db";

export const fetchCratePreviewThumbs = async ({
  userId,
  crateIds,
}: {
  userId: number;
  crateIds: string[];
}): Promise<Map<string, string[]>> => {
  if (crateIds.length === 0) {
    return new Map();
  }

  const rows = await orm.CrateReleases.where({ userId })
    .where((release) => release.crateId.in(crateIds))
    .orderBy((release) => release.crateId.asc())
    .orderBy((release) => release.sortOrder.asc())
    .orderBy((release) => release.addedAt.asc())
    .select("crateId", "releaseData")
    .all();

  return groupPreviewThumbsByCrateId(
    rows.map((row) => ({
      crate_id: row.crateId,
      release_data: row.releaseData,
    })),
  );
};
