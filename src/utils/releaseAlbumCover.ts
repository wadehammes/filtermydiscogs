import type { DiscogsRelease } from "src/types";

import { getReleaseImageUrl } from "src/utils/helpers";

export const resolveReleaseDisplayImageUrl = (
  release: Pick<DiscogsRelease, "basic_information">,
  width = 240,
  height = 240,
): string =>
  getReleaseImageUrl({
    thumb: release.basic_information.thumb,
    cover_image: release.basic_information.cover_image,
    width,
    height,
    preferCoverImage: true,
    fallbackToPlaceholder: false,
  });

export const resolvePlaylistTrackReleaseImageUrl = (
  release: DiscogsRelease | undefined,
): string => (release ? resolveReleaseDisplayImageUrl(release) : "");
