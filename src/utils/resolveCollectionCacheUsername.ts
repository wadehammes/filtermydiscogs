interface CollectionCacheUsernameSource {
  isAuthenticated: boolean;
  username: string | null;
  reconnectUsername: string | null;
  rateLimited: boolean;
}

export function resolveCollectionCacheUsername({
  isAuthenticated,
  username,
  reconnectUsername,
  rateLimited,
}: CollectionCacheUsernameSource): string | null {
  if (rateLimited) {
    return null;
  }

  if (isAuthenticated && username) {
    return username;
  }

  return reconnectUsername;
}
