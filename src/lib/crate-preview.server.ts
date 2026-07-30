import { groupPreviewThumbsByCrateId } from "src/lib/crate-preview";
import { prisma } from "src/lib/db";

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

  const rows = await prisma.crateRelease.findMany({
    where: {
      user_id: userId,
      crate_id: { in: crateIds },
    },
    orderBy: [{ crate_id: "asc" }, { sort_order: "asc" }, { added_at: "asc" }],
    select: {
      crate_id: true,
      release_data: true,
    },
  });

  return groupPreviewThumbsByCrateId(rows);
};
