import {
  groupPreviewThumbsByCrateId,
  listCrateCoverThumbUrlsInOrder,
} from "src/lib/crate-preview";
import { prisma } from "src/lib/db";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

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

export const fetchPublicCrateCoverThumbUrls = async ({
  userId,
  crateId,
  maxThumbs = PLAYLIST_HERO_MOSAIC_MAX_TILES,
}: {
  userId: number;
  crateId: string;
  maxThumbs?: number;
}): Promise<string[]> => {
  const rows = await prisma.crateRelease.findMany({
    where: {
      user_id: userId,
      crate_id: crateId,
    },
    orderBy: [{ sort_order: "asc" }, { added_at: "asc" }],
    take: Math.max(maxThumbs * 4, maxThumbs),
    select: {
      release_data: true,
    },
  });

  return listCrateCoverThumbUrlsInOrder(rows, maxThumbs);
};
