import type { DiscogsBasicInformation } from "src/types";
import { sortFormatTags } from "src/utils/formatFilterTags";

const addTrimmedTags = (tags: Set<string>, values: string[] | undefined) => {
  values?.forEach((value) => {
    const trimmed = value?.trim();
    if (trimmed) {
      tags.add(trimmed);
    }
  });
};

export function getReleaseGenreStyleTags(
  basicInformation: DiscogsBasicInformation,
): string[] {
  const tags = new Set<string>();

  addTrimmedTags(tags, basicInformation.genres);
  addTrimmedTags(tags, basicInformation.styles);

  return sortFormatTags(Array.from(tags));
}
