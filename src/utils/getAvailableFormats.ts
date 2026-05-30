import type { DiscogsRelease } from "src/types";
import {
  getReleaseFormatTags,
  sortFormatTags,
} from "src/utils/formatFilterTags";

export const getAvailableFormats = (releases: DiscogsRelease[]): string[] => {
  const formatSet = new Set<string>();

  releases.forEach((release) => {
    getReleaseFormatTags(release.basic_information.formats).forEach((tag) => {
      formatSet.add(tag);
    });
  });

  return sortFormatTags(Array.from(formatSet));
};
