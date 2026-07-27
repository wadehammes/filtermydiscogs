import type { DiscogsRelease } from "src/types";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";

export const getAvailableStyles = (releases: DiscogsRelease[]): string[] => {
  const tagSet = new Set<string>();

  releases.forEach((release) => {
    getReleaseGenreStyleTags(release.basic_information).forEach((tag) => {
      tagSet.add(tag);
    });
  });

  return Array.from(tagSet).sort();
};
