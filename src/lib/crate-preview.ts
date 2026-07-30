import type { DiscogsRelease } from "src/types/discogs-release.types";
import { getReleaseImageUrl } from "src/utils/helpers";

export const CRATE_HUB_PREVIEW_COUNT = 3;

export const extractPreviewThumbUrl = (releaseData: unknown): string => {
  const release = releaseData as DiscogsRelease;
  const basic = release?.basic_information;

  return getReleaseImageUrl({
    thumb: basic?.thumb,
    cover_image: basic?.cover_image,
    width: 240,
    height: 240,
  });
};

export const groupPreviewThumbsByCrateId = (
  rows: { crate_id: string; release_data: unknown }[],
): Map<string, string[]> => {
  const byCrate = new Map<string, string[]>();

  for (const row of rows) {
    const existing = byCrate.get(row.crate_id) ?? [];

    if (existing.length >= CRATE_HUB_PREVIEW_COUNT) {
      continue;
    }

    existing.push(extractPreviewThumbUrl(row.release_data));
    byCrate.set(row.crate_id, existing);
  }

  return byCrate;
};
