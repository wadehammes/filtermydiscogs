export const buildDiscogsUserProfileUrl = (username: string): string =>
  `https://www.discogs.com/user/${encodeURIComponent(username)}`;
