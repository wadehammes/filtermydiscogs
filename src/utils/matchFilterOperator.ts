import type { StyleOperator } from "src/types/filters.types";

export const matchSelectedTagsWithOperator = (
  selectedTags: readonly string[],
  operator: StyleOperator,
  releaseHasTag: (tag: string) => boolean,
): boolean => {
  if (selectedTags.length === 0) {
    return true;
  }

  if (operator === "AND") {
    return selectedTags.every(releaseHasTag);
  }

  if (operator === "NONE") {
    return !selectedTags.some(releaseHasTag);
  }

  return selectedTags.some(releaseHasTag);
};
