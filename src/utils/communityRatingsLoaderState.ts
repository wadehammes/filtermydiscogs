const RATE_LIMIT_COOLDOWN_MS = 60_000;

let rateLimitedUntil = 0;

export const COMMUNITY_RATINGS_REQUEST_INTERVAL_MS = 1100;

export const isCommunityRatingsRateLimited = (): boolean => {
  return Date.now() < rateLimitedUntil;
};

export const pauseCommunityRatingsLoader = (
  cooldownMs = RATE_LIMIT_COOLDOWN_MS,
): void => {
  rateLimitedUntil = Date.now() + cooldownMs;
};
