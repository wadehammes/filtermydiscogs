export interface CachedDiscogsIdentity {
  userId: number;
  username: string;
  verifiedAt: number;
}

interface IdentityCacheKeyParams {
  accessToken: string;
  accessTokenSecret: string;
}

interface GetCachedIdentityParams {
  cacheKey: string;
  allowStale?: boolean;
}

interface SetCachedIdentityParams {
  cacheKey: string;
  identity: { userId: number; username: string };
}

interface SetInFlightIdentityRequestParams {
  cacheKey: string;
  request: Promise<CachedDiscogsIdentity>;
}

const IDENTITY_CACHE_TTL_MS = Number.parseInt(
  process.env.IDENTITY_CACHE_TTL_MS || "300000",
  10,
);
const IDENTITY_CACHE_STALE_MS = Number.parseInt(
  process.env.IDENTITY_CACHE_STALE_MS || "1800000",
  10,
);

const identityCache = new Map<string, CachedDiscogsIdentity>();
const inFlightIdentityRequests = new Map<
  string,
  Promise<CachedDiscogsIdentity>
>();

const IDENTITY_CACHE_KEY_SEP = "\u0001";

export const getIdentityCacheKey = ({
  accessToken,
  accessTokenSecret,
}: IdentityCacheKeyParams): string =>
  `${accessToken}${IDENTITY_CACHE_KEY_SEP}${accessTokenSecret}`;

export const getCachedIdentity = ({
  cacheKey,
  allowStale = false,
}: GetCachedIdentityParams): CachedDiscogsIdentity | null => {
  const entry = identityCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  const ageMs = Date.now() - entry.verifiedAt;
  if (ageMs <= IDENTITY_CACHE_TTL_MS) {
    return entry;
  }

  if (allowStale && ageMs <= IDENTITY_CACHE_STALE_MS) {
    return entry;
  }

  if (ageMs > IDENTITY_CACHE_STALE_MS) {
    identityCache.delete(cacheKey);
  }

  return null;
};

export const setCachedIdentity = ({
  cacheKey,
  identity,
}: SetCachedIdentityParams): CachedDiscogsIdentity => {
  const entry: CachedDiscogsIdentity = {
    userId: identity.userId,
    username: identity.username,
    verifiedAt: Date.now(),
  };
  identityCache.set(cacheKey, entry);
  pruneIdentityCache();
  return entry;
};

export const clearCachedIdentity = (cacheKey: string): void => {
  identityCache.delete(cacheKey);
  inFlightIdentityRequests.delete(cacheKey);
};

export const getInFlightIdentityRequest = (
  cacheKey: string,
): Promise<CachedDiscogsIdentity> | undefined =>
  inFlightIdentityRequests.get(cacheKey);

export const setInFlightIdentityRequest = ({
  cacheKey,
  request,
}: SetInFlightIdentityRequestParams): void => {
  inFlightIdentityRequests.set(cacheKey, request);
  request.finally(() => {
    inFlightIdentityRequests.delete(cacheKey);
  });
};

const pruneIdentityCache = (): void => {
  if (identityCache.size <= 1000) {
    return;
  }

  const staleBefore = Date.now() - IDENTITY_CACHE_STALE_MS;
  for (const [key, entry] of identityCache.entries()) {
    if (entry.verifiedAt < staleBefore) {
      identityCache.delete(key);
    }
  }
};
