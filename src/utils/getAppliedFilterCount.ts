export type AppliedFilterCountInput = {
  searchQuery: string;
  selectedStyles: string[];
  excludedStyles?: string[];
  selectedYears: number[];
  excludedYears?: number[];
  selectedFormats: string[];
  excludedFormats?: string[];
};

export const getAppliedFilterCount = ({
  searchQuery,
  selectedStyles,
  excludedStyles = [],
  selectedYears,
  excludedYears = [],
  selectedFormats,
  excludedFormats = [],
}: AppliedFilterCountInput): number => {
  let count = 0;

  if (searchQuery.trim().length > 0) {
    count += 1;
  }

  if (selectedStyles.length > 0 || excludedStyles.length > 0) {
    count += 1;
  }

  if (selectedYears.length > 0 || excludedYears.length > 0) {
    count += 1;
  }

  if (selectedFormats.length > 0 || excludedFormats.length > 0) {
    count += 1;
  }

  return count;
};
