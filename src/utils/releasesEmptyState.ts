export type ReleasesEmptyStateCopy = {
  title: string;
  description: string;
};

export const resolveReleasesEmptyState = (input: {
  allReleaseCount: number;
  hasActiveFilters: boolean;
  isRandomMode: boolean;
}): ReleasesEmptyStateCopy => {
  if (input.allReleaseCount === 0) {
    return {
      title: "No releases in your collection",
      description:
        "When you add releases on Discogs, they will appear here after the next sync.",
    };
  }

  if (input.hasActiveFilters || input.isRandomMode) {
    return {
      title: "No releases found",
      description: "Try adjusting your filters to see more results.",
    };
  }

  return {
    title: "No releases found",
    description: "Try adjusting your filters to see more results.",
  };
};
