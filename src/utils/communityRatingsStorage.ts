export const COMMUNITY_RATINGS_STORAGE_KEY =
  "filtermydiscogs_community_ratings";

export type CommunityRatingsCache = Record<string, number | null>;

const isCommunityRatingsCache = (
  value: unknown,
): value is CommunityRatingsCache => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value).every(
    (entry) => entry === null || typeof entry === "number",
  );
};

export const readCommunityRatingsCache = (): CommunityRatingsCache => {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = localStorage.getItem(COMMUNITY_RATINGS_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (isCommunityRatingsCache(parsed)) {
      return parsed;
    }
  } catch {
    // Corrupt storage falls back to empty cache below.
  }

  localStorage.removeItem(COMMUNITY_RATINGS_STORAGE_KEY);
  return {};
};

export const writeCommunityRatingsCache = (
  cache: CommunityRatingsCache,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(COMMUNITY_RATINGS_STORAGE_KEY, JSON.stringify(cache));
};

export const upsertCommunityRatingCache = (
  releaseId: string,
  average: number | null,
): CommunityRatingsCache => {
  const nextCache = {
    ...readCommunityRatingsCache(),
    [releaseId]: average,
  };

  writeCommunityRatingsCache(nextCache);
  return nextCache;
};

export const clearCommunityRatingsCache = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(COMMUNITY_RATINGS_STORAGE_KEY);
};
