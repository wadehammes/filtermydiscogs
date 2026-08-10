export type AppliedFilterCountInput = {
  searchQuery: string;
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
};

export const getAppliedFilterCount = ({
  searchQuery,
  selectedStyles,
  selectedYears,
  selectedFormats,
}: AppliedFilterCountInput): number => {
  let count = 0;

  if (searchQuery.trim().length > 0) {
    count += 1;
  }

  if (selectedStyles.length > 0) {
    count += 1;
  }

  if (selectedYears.length > 0) {
    count += 1;
  }

  if (selectedFormats.length > 0) {
    count += 1;
  }

  return count;
};
