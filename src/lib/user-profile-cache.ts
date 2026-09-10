interface CachedUserAvatar {
  avatarUrl: string | null;
  fetchedAt: number;
}

const USER_AVATAR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const avatarCache = new Map<number, CachedUserAvatar>();
const inFlightAvatarRequests = new Map<number, Promise<string | null>>();

export function getCachedUserAvatarUrl(
  userId: number,
): string | null | undefined {
  const entry = avatarCache.get(userId);
  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.fetchedAt > USER_AVATAR_CACHE_TTL_MS) {
    avatarCache.delete(userId);
    return undefined;
  }

  return entry.avatarUrl;
}

export function setCachedUserAvatarUrl(
  userId: number,
  avatarUrl: string | null,
): void {
  avatarCache.set(userId, {
    avatarUrl,
    fetchedAt: Date.now(),
  });

  if (avatarCache.size > 1000) {
    const staleBefore = Date.now() - USER_AVATAR_CACHE_TTL_MS;
    for (const [key, value] of avatarCache.entries()) {
      if (value.fetchedAt < staleBefore) {
        avatarCache.delete(key);
      }
    }
  }
}

export function getInFlightAvatarRequest(
  userId: number,
): Promise<string | null> | undefined {
  return inFlightAvatarRequests.get(userId);
}

export function setInFlightAvatarRequest(
  userId: number,
  request: Promise<string | null>,
): void {
  inFlightAvatarRequests.set(userId, request);
  request.finally(() => {
    inFlightAvatarRequests.delete(userId);
  });
}

export function clearCachedUserAvatarUrl(userId: number): void {
  avatarCache.delete(userId);
  inFlightAvatarRequests.delete(userId);
}
