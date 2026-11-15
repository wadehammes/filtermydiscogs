import { Prisma } from "@prisma/client";
import {
  CRATE_HUB_PREVIEW_ROW_LIMIT,
  groupPreviewThumbsByCrateId,
  listCrateCoverThumbUrlsInOrder,
} from "src/lib/crate-preview";
import { prisma } from "src/lib/db";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

type CrateReleasePreviewRow = {
  crate_id: string;
  release_data: unknown;
};

const listCratePreviewReleaseRows = async ({
  userId,
  crateIds,
  rowLimitPerCrate,
}: {
  userId: number;
  crateIds: string[];
  rowLimitPerCrate: number;
}): Promise<CrateReleasePreviewRow[]> =>
  prisma.$queryRaw<CrateReleasePreviewRow[]>`
    SELECT crate_id, release_data
    FROM (
      SELECT
        crate_id,
        release_data,
        ROW_NUMBER() OVER (
          PARTITION BY crate_id
          ORDER BY sort_order ASC, added_at ASC
        ) AS row_num
      FROM crate_releases
      WHERE user_id = ${userId}
        AND crate_id IN (${Prisma.join(crateIds)})
    ) ranked
  WHERE row_num <= ${rowLimitPerCrate}
  `;

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

  const rows = await listCratePreviewReleaseRows({
    userId,
    crateIds,
    rowLimitPerCrate: CRATE_HUB_PREVIEW_ROW_LIMIT,
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
