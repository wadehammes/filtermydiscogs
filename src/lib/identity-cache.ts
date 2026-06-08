import { createHash } from "node:crypto";

export interface CachedDiscogsIdentity {
  userId: number;
  username: string;
  verifiedAt: number;
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

export function getIdentityCacheKey(
  accessToken: string,
  accessTokenSecret: string,
): string {
  return createHash("sha256")
    .update(`${accessToken}:${accessTokenSecret}`)
    .digest("hex");
}

export function getCachedIdentity(
  cacheKey: string,
  allowStale = false,
): CachedDiscogsIdentity | null {
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
}

export function setCachedIdentity(
  cacheKey: string,
  identity: { userId: number; username: string },
): CachedDiscogsIdentity {
  const entry: CachedDiscogsIdentity = {
    userId: identity.userId,
    username: identity.username,
    verifiedAt: Date.now(),
  };
  identityCache.set(cacheKey, entry);
  pruneIdentityCache();
  return entry;
}

export function clearCachedIdentity(cacheKey: string): void {
  identityCache.delete(cacheKey);
  inFlightIdentityRequests.delete(cacheKey);
}

export function getInFlightIdentityRequest(
  cacheKey: string,
): Promise<CachedDiscogsIdentity> | undefined {
  return inFlightIdentityRequests.get(cacheKey);
}

export function setInFlightIdentityRequest(
  cacheKey: string,
  request: Promise<CachedDiscogsIdentity>,
): void {
  inFlightIdentityRequests.set(cacheKey, request);
  request.finally(() => {
    inFlightIdentityRequests.delete(cacheKey);
  });
}

function pruneIdentityCache(): void {
  if (identityCache.size <= 1000) {
    return;
  }

  const staleBefore = Date.now() - IDENTITY_CACHE_STALE_MS;
  for (const [key, entry] of identityCache.entries()) {
    if (entry.verifiedAt < staleBefore) {
      identityCache.delete(key);
    }
  }
}
